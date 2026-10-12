# construct: fiction range, story mechanisms, and what they ask of a world

Read-only audit of `/home/k/Newproject` (main at the time of reading, plus the unmerged `holo-bridge` branch where noted). Paths are relative to `/home/k/Newproject` unless absolute. 2026-10-11.

## 0. The short answer to Kabe's question

construct already does what Kabe is pointing at. In construct, "investigation story = investigation mechanics" is one case of a general rule: **every fiction type is a mechanism**. It works in three layers:

1. **155 game-type cards in 19 families.** These are flavour and lens: what the narrator dwells on, what it skips, the tension shape, what winning and losing mean, and what the world must contain (`docs/design/GAME-TYPE-TAXONOMY.md`; generated into `construct/play_styles_data.py`).
2. **Nine story shapes, which are the actual engines.** They are Deduction, Bond, Endurance, Contest, Gambit, Discovery, Mastery, Farce and Transformation (`construct/story_shapes.py:19-31`). Every card maps to one through its family (`story_shapes.py:82-102`). Each shape has its own:
   - medium;
   - withheld value;
   - kind of commitment;
   - kind of judgment;
   - payoff;
   - conclusion trigger;
   - way the run's costs colour the ending (`cost_disposition`);
   - owner of the terminal (the player's commitment, or a world event).
3. **One shared grammar under all of them:** beats, pillars, clocks, pins and gauges (`construct/arc/grammar.py`). Shapes are **blendable**: a world has a primary shape plus secondaries, and blends are first-class. The founder's framing: "a story is NOT one shape. It is a STACK of shape-layers" (`docs/design/SHAPE-STRUCTURES.md:3-14`).

Investigation is construct's most developed shape: it has a cast of witnesses and suspects, red herrings and a solvability check. The other eight are designed to the same depth in `docs/design/STORY-SHAPES-CATALOG.md`, but are thinner in code and in live play.

## 1. The fiction types construct anticipates

### 1a. Where they are named

| Source | What it names |
|---|---|
| `docs/design/GAME-TYPE-TAXONOMY.md:1-8`, families at 30-2127 | 155 cards in 19 families. Each card carries a pitch, core loop, Dramatize, Hand-wave, tension shape, win, loss, World requires, and a directive. |
| `construct/play_styles_data.py` (`STYLE_CARDS`) | The same cards generated as data (do not hand-edit; `scripts/build_play_styles.py`). Each card's directive rides in the narrator's briefing every turn (`docs/design/GAME-TYPES.md:88-103`). |
| `docs/design/GAME-TYPE-CARDS.md` | An earlier, shorter card set. It is the one that includes "Dungeon Crawl" (line 234), "Romance / Courtship" (274) and "Trial / Courtroom" (50). |
| `docs/design/GAME-TYPES.md:140-160` | The original shortlist: Mystery, Puzzle/Escape, Heist, Action/Combat, Romance/Dating-sim, Survival, Paranormal/Horror investigation, Exploration, Intrigue, and Free Improvised Narrative as "a first-class entry". |
| `construct/story_shapes.py:36-77, 82-110` | The nine shapes, family→primary shape, and default blends: Horror = Endurance+Discovery, Mythic = Transformation+Discovery, Time/Reality = Discovery+Deduction, Moral drama = Transformation+Bond. |
| `docs/design/STORY-SHAPES.md:142-200` | The shape table, each with a reference fiction: *Knives Out*, *Pride & Prejudice*, *The Road*, *Rocky*, *Ocean's Eleven*, *Arrival*, *Whiplash*, *The Hangover*, *A Christmas Carol*. |
| `construct/laws.py:30-60`; `docs/design/WORLD-LAWS.md:70-110` | A per-family palette of world-law registers (metaphysical, systemic, social, environmental, delta) and a reality register (real, alternate, secondary). |
| `docs/design/GAME-TYPE-TAXONOMY.md:2194-2229` | Merge rules: noir, cyberpunk, western, gothic, zombie, superhero and so on are *skins*, not types. Delivery modes (sandbox, roguelike, branching VN, co-op) are not types either. |

### 1b. Example worlds and probes, with their types

All of these have metadata in `worlds/*.meta.json`.

- **bodycase**, *The Rain in Bluegate Yard*.
  - Victorian murder; `detective_procedural` + `mystery_whodunnit` → Deduction; win/loss mode.
  - Pillars: motive (the stolen sample token), connection (the victim's last errand), opportunity (the warehouse route), alibis and contradictions.
  - Clocks: escalation clocks fire at `turns_quiet` 4 to 14, on the rungs surface, draw and converge.
  - Pins: clue objects (cab lamp, blue thread, brass token, scale weight).
- **thedeep**, *The Last Forty-Seven Minutes*.
  - Undersea habitat; `wilderness_survival` + `rescue_extraction` → Endurance.
  - Act beats (`event_occurs`): `remaining_air_is_reckoned`, `life_support_is_sacrificed_for_escape`, `survivors_escape_orpheus`.
  - Pillars: oxygen clock, ascent vehicle, medical triage, scrubber theft.
  - The gauge primitive (oxygen draining 100→20) was proven on an endurance harness. thedeep's own metadata authors no gauge, and nothing adds one automatically (`docs/design/GAUGE-PRIMITIVE.md:1-12`).
- **emberroad**, *The Ember That Burned Cold*.
  - Dark-fantasy pilgrimage; `epic_quest_saga` + `pilgrimage` → Transformation, with Discovery mixed in.
  - Act beats: `bell_cairn_vow_paid`, `mount_veyr_threshold_reached`, `cold_ember_demands_a_cost`, `relic_fate_chosen`.
  - Pillars: home left behind, cost of understanding, rival readings, inherited burden, chosen next step.
  - **emberroad2** (its chapter 2) was retyped to `political_intrigue` + `social_drama`.
- **ironhold**, *The Weight of Elias Venn*.
  - Grimdark prison escape; `detective_procedural` + `social_drama` → Deduction+Bond.
  - Goal: "Escape Ironhold before the hanging".
  - World law: "The River Warrant" (systemic). Bell-round schedules; a chaplain "available_at seventh bell only".
- **post**, *The Frontier Post*: endless mode, "bring the post through the season". This is stewardship.
- Attic probes:
  - **probe_farce**: "Madame Under the Bell", with a metaphysical law: the tower bell rings when a lie is spoken beneath it.
  - **probe_heist**: Monaco; law "The Grand Prix Clock".
  - **probe_legal**: Washington paper maze.
  - **probe_romance**: Lisbon wedding; law "The Table of Third Parties".
- **anchor**, *The Last Honest Meter*: the first playable, a meter conspiracy (`examples/`).
- **Live Telegram worlds**:
  - cozy magical-realism mystery + `community_healing` + `romance`, with law "The Fog Bell Hour";
  - two survival thrillers;
  - a noir mystery + `political_intrigue`.
- **Shape-sweep briefs** (`scripts/shape_sweep.py:16-21`):
  - `sw_discovery` (an uncharted ruin);
  - `sw_mastery` (a failing estate over one season);
  - `sw_farce` (a nobody taken for a dignitary);
  - `sw_transformation` (a redemption quest);
  - Contest ("Dusk at Mercy Ford") and Gambit ("Bellglass Vault") are noted as validated strong.
- **gauge_bond** (`scripts/gauge_codex.py`): "a slow-burn romance … a long winter in a remote lighthouse station", `romance`.
- **Showcase presets** (`scripts/build_presets.py:23-50`):
  - latch: a locked-room detective story;
  - thedeep: survival with a gauge and a clock;
  - emberroad: a quest.

### 1c. Each shape: what drives it, how it paces, what the player does

Sources:
- `story_shapes.py:36-77` (schema), `:121-140` (narrator discipline), `:158-174` (conclusion), `:182-291` (signature elements);
- `STORY-SHAPES-CATALOG.md` (pillars per shape);
- `SHAPE-STRUCTURES.md:76-91` (card types, delivery channels, the minimum hooks to offer);
- `CARD-WEAVING.md:33-46`.

**Deduction**: investigation, puzzle, decoding, interpretation.
- Drive: clues fill pillars (motive, means, opportunity, proof). Each pillar is genuine, false (a red herring held as true) or unfilled, read from the player's knowledge frame.
- Withheld: the answer.
- Commitment: an accusation (`claim`), judged claim against fact.
- Ending: the player's commitment closes it. Untimed, with peril colouring the ending and room for redemption.
- Cast schema (`cohorts.py:370-430`):
  - presence: `at_scene` / `nearby` / `offscene`;
  - reveal modes: `volunteered` / `pressed` / `traded` / `contradicted`;
  - reveal conditions: `none`, `trust`, `pressure`, `object_seen`, `examined`, `scrutiny`;
  - each clue's `coverage_effect`: `genuine`, `false` or `context`.
- Signatures: red herrings, cross-suspicion, alibis and contradictions, the culprit present and findable, the earned reveal.
- Verbs: ASK, EXAMINE, go to people named in testimony, accuse.

**Bond**: romance, dating sim, social drama, found family, reconciliation, negotiation.
- Drive: relationship pillars. Mutual vulnerability (a wound shown *and* met), the obstacle confronted, trust tested and held, the first misread corrected.
- Withheld: unearned intimacy.
- Commitment: a declaration (a relational state). A declaration made too early "rings hollow and is rebuffed".
- Ending: commitment, judged by a "repair" reading (rupture and repair is the path). Untimed.
- Signatures: earned intimacy, real friction, a misread corrected, the costly gesture, a two-sided other, and **"the grounded interior"**. That last one means the story is authored at room granularity and opens "inside one specific named room … never at street, neighborhood, or city scale" (`story_shapes.py:207-213`; `SHAPE-PLACE-GRANULARITY.md`).
- Verbs: RELATE (share a moment, offer vulnerability, make a gesture), CHOOSE (stay, refuse, declare).
- There is no meter. Coverage reads relational facts in the player's frame. The romance profile is "the falsifier: it must carry no clue-trail and still resolve" (`STORY-SHAPES.md:207-209`).

**Endurance**: survival, horror (with Discovery), disaster.
- Drive: route (refuge), means (resource), vulnerable (keep the weak one alive), humanity (no needless atrocity).
- Nodes: threat, resource and refuge sit in world state, not in anyone's knowledge.
- Clocks and gauges: coupled clocks (cold × fuel) and gauges (oxygen). A false refuge is a trap.
- Withheld: relief.
- Ending: a world event closes it (survive or escape), with a soft clock and "sacrifice" as the colouring. Death policy is usually `mortal`.
- Signatures: mounting threat, scarcity, the clock, isolation, the glimpsed dread.
- Verbs: ACT (reach a refuge, secure a resource, ration, carry, sacrifice). The authored "do X" beats are `event_occurs`.

**Contest**: combat, duel, tournament, sports, racing, monster hunt.
- Drive: competence earned, rival understood, standard internalised. These are pillars decoupled from the scoreboard.
- The scoreboard is a separate canon `Occurred` win or loss event read next to them (`turnloop.py` `_literal_result`, ~3765-3800). That is how "proved himself, lost the decision" (Rocky) can be represented.
- Ending: commitment; untimed.
- Signatures: escalating rounds, a worthy rival, preparation pays, scoreboard against meaning.
- Verbs: ACT (train, perform, fight), EXAMINE (scout the rival's tell).
- There is no combat system. "an optional stats/modifier layer, is explicitly a LATER idea, banked" (`GAME-TYPES.md:18-20, 162-164`). Combat is "a sequence of uncertain attempts, one draw each" from the resolution deck (`ACTION-RESOLUTION.md:56-58`).

**Gambit**: heist, infiltration, con, espionage, politics, factions, crime-lord rise.
- Drive: defenses mapped (at least two real layers), crew aligned, leverage secured, a contingency set.
- The twist is a reveal beat (`Beat.correlates`, `grammar.py:150-154`).
- Ending: commitment (`plan_executed`).
- Signatures: factions with competing agendas, the plan and its execution, complications that force adaptation, the concealed twist.
- Verbs: ASK, EXAMINE (case the job), ACT (execute).
- For stealth, the card dwells on "sightlines, patrol patterns, shadow, sound, cover" (`play_styles_data.py:119`).

**Discovery**: exploration, **dungeon delve**, ruins, first contact, pilgrimage (secondary), time and reality.
- Drive: place mapped (at least two strata), explanations weighed, true meaning grasped, cost accepted.
- Nodes: sites and phenomena live in world state, gated by depth (`reveal_condition: prior_site | returned-to`).
- Withheld: wonder.
- Ending: pillars plus commitment ("understood" and "chose"), with "sacrifice" as the colouring.
- Signatures: gradual unfolding, wonder, the place as a character, competing explanations, the cost of knowing.
- Verbs: EXPLORE, EXAMINE, ASK guides, choose a meaning.
- Note: **Dungeon Delve sits in the Exploration family, so its engine is Discovery.** Its card dwells on "distinct rooms, threats, treasure, light, spells, HP, supplies, traps, and push-your-luck retreat", and its loop is a "risk/reward ratchet" (`GAME-TYPE-TAXONOMY.md:749-760`). The shape engine underneath has no loot or health mechanism. Those would come from gauges, a mortal death policy and the resolution deck.

**Mastery**: craft, performance, stewardship, settlement, tycoon, professional procedure (medical, legal, dispatch).
- Drive: fundamentals (through setback), standard met, cost reckoned.
- The material or system is a world node with `difficulty_axes`. The status is ordinal: `unmet`, `partial`, `met_brittle` or `met_genuine`.
- Ending: commitment (`performed`, `delivered`).
- Verbs: ACT (practise, build, perform), and being judged.

**Farce**: cover-up, mistaken identity, prank war, bureaucratic absurdity.
- **The polarity is inverted.** A pillar filled false means "the comic engine is LIVE". The ranking is false > genuine (defused) > unfilled ("damp squib"), and the colouring is `fail_forward`.
- Ending: a world event or deadline (the King arrives regardless).
- Signatures: mistaken identity, compounding complications, the blowup, false coverage counting as the engine running.
- Verbs: CHOOSE or ACT (compound a lie or defuse it), hide an object, time an entrance.

**Transformation**: redemption, tragedy, coming of age, rite of passage, epic quest, underworld descent, fairy-tale bargain.
- Drive: old self seen, temptation refused *at a cost*, change proven by a costly act ("never words"), wrong made right. This maps to `DeltaType` (`grammar.py:110-116`).
- Ending: the moment of choice; a soft clock.
- Verbs: CHOOSE, and ACT through a costly deed.

**Free improvised narrative** (no card) is "the honest default, not a failure mode" (`GAME-TYPES.md:137-138`). Sandbox and freeplay have no global ending until a thread is minted (`STORY-SHAPES.md:124-127`).

### 1d. Pacing by type

**Tension shapes** (`GAME-TYPE-TAXONOMY.md:2166-2177`):
- accretion;
- ratchet;
- attrition/grind;
- slow warming;
- episodic spikes;
- spiral;
- gated unlock;
- oscillation;
- countdown;
- stress test.

**Conclusion clock per shape** (`story_shapes.py:158-174`): none (Deduction, Bond, Contest, Gambit, Discovery, Mastery) or soft (Endurance, Farce, Transformation). A hard clock can be nested ("Batman, 10 minutes" inside an untimed detective arc, `STORY-SHAPES.md:65-66`).

**Suspense amplifier**: "peril" for the Survival, Horror and Action families; "general" for everything else (`story_shapes.py:343-359`).

**Phase budgets**: soft turn budgets per phase, "genre-set at session zero" (`ARC-LAYER.md:72-74`).

**Founding example of dwell versus skip** (`GAME-TYPES.md:9-24`):
- Mystery hand-waves travel ("You catch a horse-trolley across the city").
- Heist and escape are the opposite: "the minutia IS the game".

**Type sets the destination.** In the same fantasy world, combat wins by slaying the dragon, while dating-sim wins when "the hard-to-get maiden finally swoons and accepts the picnic in yonder meadow" (`GAME-TYPES.md:26-32`).

## 2. How the narrative engine chooses and switches mechanics

**Choosing (at build).** Ingested fiction's type is **"DERIVED FROM THE SOURCE and LOCKED at ingest"**. *The Hobbit* can be offered adventure, survival or puzzle, "never romance". Built worlds take the type as an *input to generation*: "the choice *makes* the substance" (`GAME-TYPES.md:34-64`).

The "World requires" field "is a gate, not flavor text" (`GAME-TYPE-TAXONOMY.md:2162-2164`). The chosen type then feeds three things:
- the narrator's directive (`play_styles.directive_for`);
- the shape briefing (`story_shapes.shape_directive`, `:362-384`);
- the signature elements the author must establish (`author_signature_directive`, `:316-325`).

The type also drives death policy (`mortal` / `premise` / `shielded`, `DEATH-TESTAMENT.md` §1; schema `cohorts.py:3049-3058`) and the world-law register palette.

**Switching within a chapter.** Mid-chapter, construct does not change genre. Instead:
- **Card weaving.** Each turn the weaver decides `let_run | pepper_hook | deliver_card` (`cohorts.py:259`; `CARD-WEAVING.md`), asking: "Does the improvised/embellished path make a RICHER … story?"
- **Tangent adoption.** If the player declares "forget the case — I'm making a life on this boat", a two-beat confirmation adopts a new arc and demotes the old main arc (`construct/tangent.py:1-25`; `WORLD-GROWTH.md`).
- **Side arcs.** The living-world generator mints them from fallout, from the player's changes, or from quiet on the story clock (README:140).

**Switching between chapters.** This is designed, partly built, and the README's "next up":
- At each chapter boundary a quick check picks one of three: **Confirm / Blend / Reshape** (`docs/design/RESOLUTION-FAN.md:196-223`).
- It reads tone and engagement with the premise, and pointedly "NOT win/loss / skill".
- If the fan of endings is invalidated (heist the crown and flee), construct re-selects the genre from the 155 cards (`RESOLUTION-FAN.md:155-194`).
- Audit: `docs/design/STRUCTURE-VALIDATION-AUDIT.md:8-12, 55-71`.
  - Blending already works because `meta["game_type"]` is a list.
  - Missing: G1 (a cohort that reflects on how the player played), G2 and G3 (write the result back and feed the continuation author), and G4 (a light/dark register dial: "no first-class support").
- The **critic genreshift** harness (`scripts/critic_harness.py:40-44, 71-90`) plays the presented story while "CURVING it" toward romance, comedy or adventure, then checks whether chapter 2 reshaped. Its finding was that chapter 2 "came back a straight mystery".

**Per-turn pacing (main).**
- **Turn order** (`ARC-LAYER.md:205-240`): classify → resolution draw → clock pass → NPC turns → beat pass (last) → pacing policy → briefing.
- **The nudge ladder** (`grammar.py:38-43`; `ARC-LAYER.md:294-341`):
  - `surface`: the briefing only mentions it;
  - `draw`: a fact is added to an NPC's frame, never a motive;
  - `converge`: a clock fires a `caused_by` consequence;
  - `confront`: world-scale, never tied to a specific NPC or to where the player is;
  - `refusal`.
- **Turns never close a story.** A refusal clock on a turn counter is suppressed (`arc/executor.py:62-75`).
- **Three acts** (`CONVERGENCE-TO-CONCLUSION.md`): Setup → Confrontation (relocate the climax to where the player is) → Resolution.

**"act/now" and "stall" beats.** These live on the **unmerged `holo-bridge` branch**, where construct authors a deck of beats in holo-emitter's own vocabulary:
- `construct/holo/deck.py` at commits `9d01f54` and `bcbc42c`, lines 222-262 and 473-487;
- `construct/holo/vocab.py`.

The rules:
- Each beat is marked `trigger: act | stall`.
- An act beat "answers something the player just did … give it rung "now" so it lands at once."
- A stall beat needs `quiet>=N` and a quiet rung: surface, draw, converge or confront, at 3/5/7/9 quiet turns.
- "Players go quiet mid-questioning, not idle in a room", so key a stall to `talking:PERSON`.
- holo-emitter's A/B found that every room-keyed stall went unheard.

In main construct, the matching split is `player_learns` against `event_occurs` beats (`cohorts.py:2035`). `event_occurs` fires through a cheap detector that may only pick from the arc's pending, authored kinds. It requires a success tier, and "default EMPTY when unsure" (`EVENT-OCCURS-FIRING.md:36-62`; `cohorts.py:2780-2793`). "That was the arc-stall root cause."

**The effect and event vocabulary a world must carry out.**

- **Clock effects in main are open EAV items, not a closed list.** They are "opaque structured items destined for `ingest_structured`", each `caused_by`-chained (`grammar.py:178-191`; `executor.py:79-88`).
  - In shipped worlds they are `pressure` events and `refusal_conclusion` (bodycase clocks).
  - The closed effect list (`spawn_person`, `move_person`, `set_var`, `reveal_thing`) is **holo-emitter's**. It is ported verbatim into `construct/holo/vocab.py` (EFFECTS), on the branch only.
- **Closed vocabularies in main:**
  - classify kinds: `action | question | declaration | exit`;
  - beat kinds: `player_learns | event_occurs`;
  - phases: `setup rising crisis climax falling`;
  - weights: `required optional flavor`;
  - rungs: `surface draw converge confront refusal`;
  - arc lifecycle: `active won lost cancelled incompletable`;
  - coverage: `genuine false unfilled`;
  - ending shapes: `triumph costly_victory bittersweet partial failure quiet_failure`;
  - commitment grades: `vindicated partial wrong pyrrhic`;
  - delta types: `drive_inverted desire_at_cost desire_renounced identity_accepted homecoming_changed`;
  - cost dispositions: `peril_redemption repair sacrifice fail_forward`;
  - world-tick kinds: `moved met_with sent_word finished_task closed_up` (`cohorts.py:3102`);
  - pin scopes: `region temporal social`;
  - death policy: `mortal premise shielded`;
  - scenario modes: `win_loss endless freeplay`.
- **Canon event kinds the host writes:**
  - `clock_fired`, `pressure`, `player_action`, `departed_scene`, `player_death`, `moment_missed`;
  - the ending consequences `word_spreads` and `reputation_changes`;
  - continuation callbacks also read `debt_called`, `door_closed` and `ally_returns` (`game.py:3002`; `turnloop.py:6457-6468`);
  - authored arc-specific `event_occurs` kinds (e.g. `survivors_escape_orpheus`).
- **The commitment stage gate** asks what is missing from the set `audience | addressee | place | means | target` before judging a decisive move (`cohorts.py:2797-2808`). An accusation needs an audience, in a place.

## 3. What construct expects of a physical world

**Places, containment and travel.**
- Places are `place:` entities linked by containment (`in`, `part_of`, `contains`, `connects_to`). The world "grows where the player walks" through a single doorway that commits everything at once or nothing (`WORLD-GROWTH.md`; `construct/growth.py`).
- Travel time is priced by `estimate_elapsed`. A route's first price becomes its precedent forever: "the same road costs the same time in both directions" (README:215; `turnloop.py:1864-1925`).
- Mystery hand-waves travel; heist and stealth dwell on it.

**Doors and portals.** The traversal policy is declared as canon (`game.py:140-172`):
- Portal kinds: `door gate hatch portal lock elevator lift shaft stairs stairway passage airlock`.
- They block when their state is `shut closed locked sealed rusted barred jammed dead decommissioned defunct failed broken collapsed welded`, or when a relation holds: `guarded_by sealed_by barred_by locked_by`.
- A portal with no stated state reads `obscured`, which is safe because it is never falsely clear.

**Objects and affordances.**
- The player's object verbs: `takes`, `takes_more`, `drops`, `examines_target`, and `requires`, meaning items claimed as used *now* (`cohorts.py:96-160`; `intent.py:25-55`).
- Adjudication checks that every claimed item resolves *and* is at hand, held by the player or in the scene. Ordinary role equipment is granted (`turnloop.py:3709-3735`).
- Fixture nouns are in-scene, never places (`turnloop.py:2133-2142`): table, door, lamp, lantern, hearth, drawer, safe, chest, hatch, grating and so on.
- Objects and sites can hold clues, revealed when `examined` or under `scrutiny` (`EXAMINE-CHANNEL.md`). A plain object gives atmosphere, never evidence.

**People.**
- Knowledge frames: `knows:<id>`; on the branch, claims go in `says:<id>`.
- Presence tiers: `at_scene / nearby / offscene`, seeded as ordinary `in` facts. "A person with NO location is never present" (`INVESTIGATION-SHAPE.md:26-46`).
- Companions follow `moved_with` / `joins` / `npcs_dismissed`. Each turn an NPC acts and speaks (`NPC_TURN_SCHEMA`).
- The off-screen world tick is discovered, never narrated. Narrated arrivals and departures become canon under five stage rules (README:214).
- Dispositions: `drive`, `fear`, `secret` attributes.

**Time.** Diegetic time is the only clock (`DIEGETIC-TIME.md`; `construct/clock.py`).
- `elapsed_minutes` accrues, estimated each turn by a cheap model call. Players can jump time: "wait until sunset", "three days later".
- **Time of day** comes from the calendar's phases, as fractions of the day (`clock.py:24-33`): night, dawn, morning, noon, afternoon, dusk, evening, night.
- Calendars are per world and **per place**: `hours_per_day` (e.g. a 72 h day) and `offset_minutes` for out-of-sync planets.
- "optional flavor (`day_name`, `unit` names, seasons) — additive". Universals such as "gravity, atmosphere, suns/moons" are named as pinned constitutive facts (`DIEGETIC-TIME.md:41-61`).
- The narrator gets "THE TIME (render its FEEL — light, sounds, who is about)" (`briefing.py:282-286`).
- Two roles for time:
  - texture (appropriateness, availability: "9 PM → the witness waits for morning") is always on;
  - pressure is opt-in per story, as a deadline in `failure_when`.
- NPC availability by hour and schedules are "the still-open follow-on".
- **Not modelled anywhere:** dates, seasons as state, moon phase, and weather. Weather appears only in prose, imagery, card directives (Wilderness Survival dwells on "weather, terrain") and laws or pins: the "Fog Bell Hour" law, "only on Luna, only during the storm" (`PINNED-AWARENESS.md:30-33`), and an ENVIRONMENTAL register ("the winter").

**Light and sound.** There is no light or sound model. Both are felt-time and prose cues. The cards name them as substance where they matter:
- stealth: shadow, sound, sightlines;
- dungeon delve: light;
- haunted house: cold spots, apparitions.

**Danger, combat and death.**
- The resolution deck is drawn only when an action needs a test (`ACTION-RESOLUTION.md:20-27`): terrible failure 10%, failure-with-opportunity 20%, success-with-cost 55%, complete success with a boon 15%. It is pre-rolled in bags of 100.
- `mortal_risk` stages peril; death comes only from persisting into peril that was shown. "Death is an EFFECT, never a draw" (`DEATH-TESTAMENT.md`).
- Gauges are numeric constraints that move both ways, with action modifiers (running burns air) and a floor that ends the story (`grammar.py:242-268`).
- There is no combat system and no health or stats.

**Discovery and secrecy.**
- Clues pass to the player's frame only when earned.
- Pins foreground clue objects, with salience that rises toward relevance (`grammar.py:209-239`).
- The `plot:` frame never enters the narrator's view; secrets never enter a character's context. Reveal beats correlate two identities.

**Inventory.** There is no inventory object. Holding is containment (`in` the protagonist). The quest and pilgrimage worlds carry `carried`, `has`, `wears` and `gave` attributes.

## 4. Stated range and what is ruled out

**Aims.**
- "a text holodeck … ingested from a book or built live" (`docs/CONCEPT.md:16`).
- The span runs "a contained Sherlock whodunit" ↔ "a there-and-back epic" of chained movements (`SHAPE-STRUCTURES.md:16-26`).
- "Imagine the intention that spanned over 10 chapters" (`WORLD-GROWTH.md`).
- "Be adaptable; serve macro-level, genre-appropriate engagement … the engine bends" (`STORY-SHAPES.md:16-23`).
- The five pillars (`OPTIMAL-IF-EXPERIENCE.md`): truth-keeping; the player's story is the story ("authored material is fuel, not scripture"); initiative; proportion; the ending is the payoff ("the player should enact the climax they earned").
- The selection rule: "solve a murder in a haunted lunar monastery" over "sci-fi gothic mystery" (`GAME-TYPE-TAXONOMY.md:2301`).

**Ruled out.**
- Types the world cannot support ("can't repurpose a quest into a dating sim", `GAME-TYPES.md:63-64`).
- Laws outside a genre's register: a courtroom drama "can never draw 'the Force'" (`WORLD-LAWS.md:70-125`).
- Win/loss verdicts. The ending is the effect of the established causes.
- Turn-count deadlines, and a numeric HUD ("never a HUD", README:138).
- Respawn and a next chapter after death.
- Changing genre because the player struggled.
- Twists that sabotage the genre ("wacky or random twists, meta-fiction, 'it was all a dream'", `cohorts.py:23-41`).
- Per-turn model judging of conditions, RL drama management, and open-ended effects or rooms (branch `HOLO-EMITTER-BRIDGE.md` §4).
- Deferred: a combat and stats layer, multiplayer, and NPC schedules.

## 5. Table: fiction type → mechanism → player verbs → what a 3D world must physically support

| Fiction type (cards) | construct's mechanism | Player verbs (construct's model) | What the 3D world must physically support |
|---|---|---|---|
| Investigation: mystery, procedural, cold case, conspiracy | Deduction. Pillars (motive, means, opportunity, proof) filled by clues; red herrings; cross-suspicion; accusation judged claim against fact; untimed, `peril_redemption` | ask, press, examine, follow a named person, read, show, accuse (commitment needs audience and place) | Rooms where suspects are present at known tiers. Clue-holding things and places that yield on close inspection. Documents to read. People who move (`move_person`) and can be found. An accusation scene with witnesses. Time of day for availability (witness waits till morning). |
| Puzzle / escape / codebreak / trap room | Deduction (puzzle family), gated unlock; win = open the final way | examine, manipulate, combine, use item, try a lock | A bounded space. Mechanisms with state (locked/sealed/jammed, open). Items that combine. Feedback on attempts. A final lock. Optional countdown gauge. |
| Romance / dating sim / social drama / reconciliation | Bond. Pillars (mutual vulnerability, obstacle confronted, trust held, misread corrected); a premature declaration is rebuffed; `repair`; untimed | relate (share a moment, confide), gesture (give, cook, wait), choose (stay, refuse), declare | **Room-scale intimate interiors** (kitchen, sitting room, a café's back room); shared venues; giftable objects; the other person present and following, with their own wants; time of day and evening light as texture; privacy (who else is in the room). |
| Survival / disaster / horror survival | Endurance. Pillars (route, means, vulnerable, humanity); coupled clocks; gauges; ended by a world event; `sacrifice`; mortal death policy | ration, carry, reach refuge, seal or repair, choose who to save, sacrifice | Draining quantities (air, warmth, fuel) moved by actions. Refuges that can be false (traps). Hazards that are staged before they kill. Companions whose condition worsens. Weather, cold and dark as real pressure (construct only has prose and laws for these). |
| Dungeon crawl / delve | Discovery engine (Exploration family) under a card about rooms, loot, HP, supplies, traps, push-your-luck; no loot or health engine in construct | explore room by room, search, take loot, retreat, fight via the resolution deck | Distinct rooms with threat and reward. Depletable light and supplies. Traps. A prize at depth. An exit route. Containment-based inventory. Would need gauges and a mortal policy wired in. |
| Exploration / ruin / first contact / pilgrimage | Discovery. Strata mapped, explanations weighed, meaning grasped, cost accepted; depth-gated sites; untimed | explore, examine strata, return and reframe, ask guides, choose a meaning | Layered places that only yield after an earlier layer is known (`returned-to`). Inscriptions and signs. Travel with consistent route times. Per-place calendars (other worlds). |
| Combat / duel / tournament / sports | Contest. Competence, rival understood, standard internalised, plus a separate win/loss world event; no combat system | train, scout, fight (one draw per exchange), perform | Rivals present with tells to observe. Arenas and rounds. A canon win/loss event. Staged mortal peril. |
| Heist / infiltration / con / political intrigue | Gambit. Defenses mapped (2+ layers), crew aligned, leverage, contingency; twist as a reveal beat | case, ask, recruit, plant, execute, adapt | Guarded spaces with real defense layers. Locks and guards (`guarded_by`). Patrol paths, sightlines, shadow and sound. Uniforms and paperwork as access. A getaway route. |
| Stewardship / settlement / craft / profession | Mastery. Fundamentals through setback, standard met, cost reckoned; ordinal system state | build, tend, practise, deliver, be judged | Changeable structures and resources. Visible growth over days and seasons (construct has days but no seasons as state). Systems with state. |
| Farce / mistaken identity / cover-up | Farce. Inverted polarity: false coverage = engine live; deadline-ended; `fail_forward` | lie, hide an object, compound or defuse, time entrances | Doors and rooms for near-misses. Hideable objects. Several people with movement schedules. A fixed deadline event (the guest arrives). |
| Redemption / tragedy / rite / epic quest | Transformation. Old self seen, temptation refused at a cost, change proven by a costly deed; ended by a choice | choose, give up something, make a costly act | Tempting objects and people. A "one to be saved" whose fate is visible. Places that carry the before/after. Epic: multi-region travel and a return home. |
| Freeplay / sandbox | No global ending; ambient threads until one is minted; living-world side arcs | anything; declare a tangent | A world that grows where the player walks. An off-screen world tick (people move, meet, close up). |

**Status flags.**
- Main construct has no closed effect list. holo-emitter's closed four exist only on construct's unmerged `holo-bridge` branch.
- The genre reshape at chapter boundaries is designed but not built (G1-G3).
- Weather, seasons, moon, schedules and combat are not modelled in construct.
