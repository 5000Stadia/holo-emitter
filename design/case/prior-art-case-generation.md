# Prior art: making cases, not writing them (after M7)

The question: how a case like `case-1660.json` (4,900 lines: cast with clues, claims and gates; things; pillars; accusation; beats; clocks; leads; `_fairness`) gets *made* from a seed, still fair (every right accusation reachable from clues, no softlock), with the household's evening simulated so testimony is checkable against it. Read 2026-10-08.

**Marks.** *Opened* = the page or paper text was fetched and read this session. *Read source* = the repository was cloned into the scratchpad and its code read (not run). *Snippet* = seen only in a search result summary. *Lead* = named, not opened. Licences were checked against the GitHub API.

---

## 1. Procedural mystery generation

### Academic

**MuSR: Testing the Limits of Chain-of-thought with Multistep Soft Reasoning** (Sprague et al., ICLR 2024). [arXiv 2310.16049](https://arxiv.org/abs/2310.16049) (opened, full PDF). Code at [Zayne-Sprague/MuSR](https://github.com/Zayne-Sprague/MuSR) (MIT; lead). It is a benchmark, but it has the clearest published recipe for a fair whodunit made by code and worded by a model:
- **Truth first, in code.** Two suspects; one is picked at random as the murderer and given three facts: *has a means*, *has a motive*, *has an opportunity*. The innocent suspect gets **two of those three, plus one "suspicious fact"** that changes nothing ("x is affiliated with a gang, and this is suspicious"). The solver Φ is a one-liner: the culprit is the suspect holding all three.
- **Reasoning tree.** An LLM expands each fact downward into leaf facts that together entail it ("opportunity" ← "had a key to the study" ← why). **Validators** reject a deduction that names the conclusion it is supposed to make you infer (e.g. the word "motive" may not appear lower in the tree). A failed draw is retried up to three times, then the branch is pruned.
- **Story in chapters.** The narrative is written one suspect-chapter at a time from that chapter's leaves only.
- **Measured.** Writing the story from all the facts in one go kept only **62%** of the leaf facts. Chaptering raised fact recall to about 93–95% and doubled length. One-shot "write a murder mystery" prompts gave short, samey stories with "spurious solutions". Humans solved **92.1%** on average (majority vote 94.1%, n=34 triple-annotated). A sanity rule ("the culprit is whoever has the longest chapter") scored at chance, which checks that the structure doesn't give the answer away.

**ClueGen: An Exploration of Procedural Storytelling in the Format of Murder Mystery Games** (Stockdale, AIIDE 2016 workshop). [OJS page](https://ojs.aaai.org/index.php/AIIDE/article/view/12896); full text read from the [AAAI PDF](https://cdn.aaai.org/ojs/12896/12896-52-16413-1-2-20201228.pdf) (opened).
- **Plot:** NPCs and families; pick one of four **motives** (jealous love, inheritance, …); pick murderer and victim; instantiate a **History**, a defining event with role slots (e.g. *StoleLover*: Anna, Ben, Caroline → Anna kills Caroline). Plot-relevant relationships are then set on an n×n matrix from −3 to 3. Each NPC has a **loyalty threshold**: the relationship strength above which they will lie for someone.
- **Simulation:** five-minute ticks. Everyone moves room to room and takes or drops items. The murderer seeks a weapon, kills when alone with the victim and hides the weapon in a container. Witnesses can say they saw someone pick something up or drop it, but not what or where.
- **Red herrings** are extra Histories involving the victim, spread as rumour.
- **No solvability check.**
- **What went wrong (n=10 testers):** a dominant strategy appeared on repeat play. Find the body, get the weapon type, collect every History, then watch those people. Players learned that "the murderer cannot be someone that no other character suspects": the generator's structure leaked the answer. Dialogue lacked gravity. Players also over-read accidents: innocents who happened to carry the weapon away were taken for accomplices.

**Mysterious Murder: MCTS-driven murder mystery generation** (Jaschek, Beckmann, Garcia, Raffe; IEEE CoG 2019). [corinnaj/mysterious-murder](https://github.com/corinnaj/mysterious-murder) (MIT; read source). The [UTS accepted manuscript](https://opus.cloud1.lib.uts.edu.au/handle/10453/141401) PDF link returned 404.
- The rules are Ceptre-style linear logic, as in `python/ceptre/rules.inc.cep`: `murder_anger: $has_weapon P * anger P P' * anger P P' * anger P P' -o !dead P'`, and `murder_cheating`, `lie_success`, `steal_caught`, `grief -o sadness`, `suicide`.
- MCTS agents choose which rules fire, so each act is caused by an earlier one, and the puzzle is to read the causal chain back.
- Motive here is just accumulated resource tokens, so the story is as rich as the rule set. There is no fairness check; the player gets whatever the trace happens to show.

**Talk of the Town** (Ryan, Summerville, Mateas, Wardrip-Fruin, "Toward Characters Who Observe, Tell, Misremember, and Lie", AIIDE 2015 workshop). [OJS page](https://ojs.aaai.org/index.php/AIIDE/article/view/12825); full text read from the [AAAI PDF](https://cdn.aaai.org/ojs/12825/12825-52-16341-1-2-20201228.pdf) (opened). This is the most complete published model of *who knows what and why*:
- **Belief representation.** Each character holds **mental models** of people and places, made of **belief facets** (name, appearance, workplace, home, *whereabouts on a given day or night*). Each facet carries its value, its predecessor, whether it is accurate, its strength, and a list of **evidence**.
- **Evidence types** (nine): reflection, observation, transference, confabulation, **lie** (origination); statement, eavesdropping (propagation); mutation (deterioration); forgetting (termination). Every piece of evidence records its source, location and time, so after play the system can trace where any belief came from.
- **Salience** decides what an observer remembers and what comes up in talk: relationship to the subject, friendship, romance, job prestige, a per-attribute table (hair and eyes are more salient than nose and chin).
- **Lies, and their weakness.** A lie is told "probabilistically according to a character's affinity toward the interlocutor, and the misinformation is **randomly chosen**". The paper names this as the part to improve.
- **Outcome.** The town is simulated 1839→1979 before play. Ryan's own later verdict ([Emily Short on his dissertation, ch. 6](https://emshort.blog/2019/05/28/curating-simulated-storyworlds-james-ryan-ch-6f/), opened): this knowledge is "not very prone to generating narrative intrigue". The characters mostly trade hair colours.

**Bad News** (Samuel, Ryan, Summerville et al., CHI 2016 / IndieCade 2016 Audience Choice). [CHI extended abstract](https://eis.ucsc.edu/papers/ryanEtAl_BadNewsCHI2016.pdf) (snippet).
- A Talk of the Town town is generated before each performance. The player must find the next of kin of a dead person.
- A hidden human "wizard" **sifts** the simulation and an actor performs the townsfolk.
- The lesson Ryan draws (Emily Short post, opened): **overgenerate and curate**. A simulation produces mostly dull material; something has to pick out the story.

**Story sifting: Felt and Winnow** (Kreminski, Dickinson, Wardrip-Fruin, ICIDS 2019; Kreminski, Dickinson, Mateas, AIIDE 2021). [mkremins/felt](https://github.com/mkremins/felt), [mkremins/winnow](https://github.com/mkremins/winnow) (snippets, plus repository metadata. **Neither repository has a licence**, so their ideas may be used but their code may not.)
- **Felt** expresses sifting patterns as Datalog queries over an event log, running on DataScript. Example, "violation of hospitality": a guest arrives, a host is kind to them, the host later harms them, and the guest never left town in between (a `not-join`).
- **Winnow** is a friendlier syntax that compiles to Felt and can match *incrementally* while the simulation runs.
- A later AIIDE paper calls Felt's negative constraints awkward (snippet).
- **For us:** this is how to find *interesting* evenings among many simulated ones. It is not how to make them fair.

**Narrative planning and ASP** (snippets unless marked).
- **Ware and Young:** Glaive / *The Best Laid Plans* ([project](https://www.cs.uky.edu/~sgware/projects/blp)). These are intentional planners: every character action must serve a goal the character holds, which is what makes a planned culprit's actions readable as clues.
- **Dabral & Martens, [Generating Explorable Narrative Spaces with ASP](https://ojs.aaai.org/index.php/AIIDE/article/view/7406)** (AIIDE 2020): a Clingo planner for plot schemas such as "betrayal".
- **Siler & Ware, [ASP narrative planning with theory of mind](https://ojs.aaai.org/index.php/AIIDE/article/view/36817)** (2025): specialised planners still beat ASP on speed.
- **Wang & Kreminski, [ASP-guided LLM story generation](https://arxiv.org/abs/2406.00554)** (Wordplay 2024; abstract opened): ASP outlines, LLM prose, more varied outlines than unguided generation. No numbers in the abstract.
- **No paper found** uses a planner or ASP to *guarantee* a mystery has a unique solution. Searches for ASP or Clingo with murder mystery and solvability turned up none.

**WikiMysteries / "Who Killed Albert Einstein?"** (Barros, Green, Liapis, Togelius, IEEE ToG 2018). [arXiv 1802.05219](https://arxiv.org/abs/1802.05219) (abstract opened). Built from open data (Wikipedia, OpenStreetMap, Commons): suspects, alibis, the paths linking them, locks and keys, dialog. Generated for the 100 most influential people of the 20th century. The abstract gives no results.

**Fair play, measured** (Wagner, Keydar, Abend 2025, "The Challenge and Reward of Fair Play in Narrative"). [arXiv 2507.13841](https://arxiv.org/html/2507.13841) (opened, first ~40% of the HTML).
- **Definitions.** Surprise is what a gullible reader fails to predict. Coherence is what a know-it-all reader can account for afterwards. Fair play is the know-it-all reader's advantage *before* the reveal.
- **Generated stories:** 14 model configurations, 10 stories each.
- **Fair play is hard for models:** mean upper-bound fair play 0.242 (n=54 annotated). Llama-3.3-70B had 6 of 10 stories and GPT-4o 4 of 10 with no real clue advantage, i.e. the ending is *deus ex machina*.
- **Surprise and coherence fight each other:** r = −0.383 with human coherence.
- **Size doesn't fix it:** fair play did not improve with model size.
- **Human baseline:** Christie 0.325 vs Conan Doyle 0.067 on human-judged fair play, and 3 of 6 Holmes stories judged *deus ex machina*.

### Commercial

**Shadows of Doubt** (ColePowered, 1.0 2024). Devblogs [#8 Simulating a City](https://colepowered.com/?p=34142) (opened), [#10 Gameplay Loop](https://colepowered.com/shadows-of-doubt-devblog-10-gameplay-loop/) (opened), [#15 Moving in the Citizens](https://colepowered.itch.io/shadows/devlog/78044/shadows-of-doubt-devblog-15-moving-in-the-citizens) (opened).
- **Routines are planned before each day,** taking 10–15 s of computation: 4–10 journeys a citizen. Deviations happen live, only a few at a time. #15 moved to goal-driven, Sims-like needs.
- **Sightings:** a global loop over *travelling* citizens tests who can see whom, and people can see across the street through lit windows.
- **Memory** starts near perfect and decays, faster for strangers, unremarkable people, and witnesses who are old or inattentive.
- **The murder:** the killer picks an acquaintance, takes the weapon, follows until the victim is alone, kills, and takes the weapon home. Failsafes make sure the body is found.
- **Incrimination:** evidence passes "incrimination" along fact links with reliability weights, for example wound → body → address → residents.
- **What goes wrong** (player threads, snippets: [1](https://steamcommunity.com/app/986130/discussions/0/6274121610029717379), [2](https://steamcommunity.com/app/986130/discussions/0/6274121610022336225)): motive and method don't matter, and a conviction can rest on one fingerprint. Killer "types" stand in for motive and aren't tied to relationships. Witnesses never name the killer. As of the 2018 devblog, nobody lies.
- **Summary:** a superb schedule simulation with a thin case on top. Its rule is that a case is solvable *if the physical traces are there*, and nothing checks that the solution is reached by reasoning.

**The Case of the Golden Idol** (Color Gray). [Game Developer interview](https://www.gamedeveloper.com/design/case-of-the-golden-idol) (opened); the Thinky Games feature returned 403. Hand-authored, without a generator:
- Scenes are minimal: only what the solution or a meaningful misdirection needs, with several clues to each conclusion where possible.
- A "thought path" scheme chaining clues (key → door → room → resident's name) "never became a reliable framework".
- Fairness came from **5–7 silent playtests** per scene, adding clues to confusing scenes and removing them from obvious ones (a will was cut because it made one case trivial).
- The "two or fewer wrong" hint helped people progress but made the game easier.
- The sequel found a "roof of complexity" (snippet).

**Others** (snippets).
- **[Murder Mystery Machine](https://www.gog.com/game/murder_mystery_machine)** (Blazing Griffin): written by TV writers. "Procedural" there means police procedural, not procedural generation.
- **[Hidden Agenda](https://nextquest.dev/games/hidden-agenda)** (Supermassive 2017): scripted branching, not a generator.
- **[Dwarf Fortress](https://en.wikipedia.org/wiki/Dwarf_Fortress)** legends: history simulated before play, which Talk of the Town copied. No mystery generation was found.
- **Sherlock Holmes games:** no generated cases found.

### Open source

- **[mystery-o-matic](https://github.com/mystery-o-matic/mystery-o-matic.github.io)** (AGPL-3.0, so ideas only; read source). A daily mystery. The rules are a Solidity contract (`scenarios/simple.template.sol`) and the **Echidna fuzzer** searches action sequences until `mysteryNotSolved()` returns false.
  - **Moves:** characters move between connected rooms in 15-minute steps. `kills` requires killer and victim alone, the weapon held, and both to have moved.
  - **Clues are events emitted by the trace:** `SawWhenLeaving`, `SawWhenArriving`, `NotSawWhenArriving`, `Heard`, `Stayed`, `FirstArrival`. Half the sightings are "foggy": "somebody", or a trait such as glasses or a hat, which a character's profile resolves.
  - **Alibi:** the killer's lie is a randomly chosen room that is neither the murder room nor their final room. Statements that would give the killer away at the scene are filtered out.
  - **No explicit uniqueness check** in the code read.
  - **For us:** the closest working model of *timeline → who-saw-whom → testimony*.
- **[murdererer PR #1](https://github.com/colinjosephbrown/murdererer/pull/1)** (MIT; opened). A unittest suite generates 100 seeded games per scenario and difficulty and checks that **pooled innocent testimony leaves exactly one suspect**.
  - **Bugs found:** witnesses saw post-murder signs in rooms where no murder happened. Some clues had one witness, who could be the murderer, so every clue now has two. One clue depended on the murder by mistake.
  - **Hard mode:** only **134 of 400** games stayed solvable once clues could come from group visits. Easy mode: 400 of 400.
- **[ai-detective](https://github.com/domlorenzandrei-creator/ai-detective)** (no licence; opened).
  - Killer, room, weapon and time are fixed first. Keycard logs, alibis and evidence are derived from that truth.
  - Two liars: the killer and a decoy who lies about somewhere else.
  - Tests over 50 seeds check that the killer's alibi contradicts the logs.
- **[Aulon-tech/Alibi](https://github.com/Aulon-tech/Alibi)** (no licence; opened).
  - A CSP with AC-3 and backtracking over a room × time-slot grid. Statements become constraints, and only the culprit may lie.
  - Claims a unique solution, with difficulty measured by how many propagation steps the solve takes. The repository doesn't show how uniqueness is checked.
- **Foul Play** ([author page](https://lnakai-osu.github.io/), snippet only; the page came back empty). A seeded JavaScript party-kit generator with "60+ rule" consistency checks, such as a clue appearing before it exists.
- **[Neighborly](https://github.com/ShiJbey/neighborly)** (MIT; lead). A Python social simulation in the Talk of the Town line.
- **[The Locked Room Murder Mystery Game](https://www.skeletoncodemachine.com/p/emergent-narrative)** (tabletop; review opened). The culprit is fixed by a token's random walk over a 5×5 grid of suspects. The lesson: "too little randomness … players invent; too much … incoherent".

---

## 2. Schedules, sightings and alibis

There are four ways the prior art makes "who was where":

1. **Pre-planned routines + live deviations.** Used by Shadows of Doubt and Talk of the Town (a day/night timestep, everyone at one place per step). Cheap, and it gives the whole household an evening that never contradicts itself. The culprit's act is a goal-driven deviation (ClueGen's murderer, SoD's killer).
2. **Search for a trace that satisfies the crime's constraints.** mystery-o-matic fuzzes until a valid murder trace exists. Mysterious Murder uses MCTS over rules. Alibi uses a CSP over a time × room grid. This guarantees the *opportunity* exists. A plain generate-and-test does the same for a small cast.
3. **Planner.** Glaive-style intentional planning: every act has a reason. More than a household of six needs.
4. **LLM agents.** [Generative Agents](https://arxiv.org/abs/2304.03442) (Park et al. 2023; full PDF opened) plan "in broad strokes", then by the hour, then in 5–15-minute chunks.
   - **Failures:** agents walked into shops already closed, and several people shared a one-person bathroom because the model assumed "dorm bathroom" meant several. Agents "embellished" memories (hallucinated plans) and were "overly formal" and "overly cooperative".
   - **Cost:** 25 agents for two game days cost "thousands of dollars in token credits" and took multiple days to run.
   - **Not for the truth layer.**

**Sightings come from co-presence plus sightlines.**
- mystery-o-matic emits a sighting on every arrival and departure, and a *negative* sighting ("did not see X") for everyone absent. Negatives are what break alibis.
- SoD tests line of sight among *moving* people.
- ClueGen lets a witness see an act (picking up, dropping) without knowing what or where.
- Talk of the Town filters every observation through salience, and later through decay.
- MuSR's object-placement domain gives each person present a fixed chance (0.33) of seeing a move, then has the model write *why* they did or didn't, e.g. busy with latte art.
- **For a fair case,** randomness should be replaced by stated reasons that can be checked: the door to the stair hall stood open, the card table faced it, the buttery door gives on the screens passage.

**Lies derived from the truth.** Every working generator does it the same way: the truth is fixed and the lie is a *transformation* of the liar's own itinerary.
- ai-detective names a room other than the scene. mystery-o-matic picks a room that is neither the scene nor where the killer ended up. In Alibi, only the culprit may lie, so a lie is a constraint that fails.
- Talk of the Town's random misinformation is the counter-example, and its authors called it the weak point.
- Our hand-written case already shows the transformations a generator needs (from the claims' `triple`s):
  - *truncate*: Daniel, `left_muniment_room_at 22:30` against the truth of 23:18;
  - *substitute*: Anne, `stayed_in nursery all the evening` against her visit from 21:50 to 22:10;
  - *advance*: Francis, `abed_by 23:00` against bed at 01:00 with the buttery at 23:15;
  - *omit a sighting*: Cressy, `saw daniel only at 21:40`;
  - *shift someone else*: Daniel, `cressy on_great_stair_at 22:30`.
- Each of those lies already lists its `broken_by`, the observations that contradict it. That is exactly what a timeline simulation produces, mechanically.
- **Motive to lie** comes from ClueGen's loyalty threshold (lying *for* someone) and from Talk of the Town's affinity, plus a person's *own* secret: Anne's plea about her jointure, Francis's drinking. The innocents' lies are what keep the culprit from being the only liar, which is ClueGen's leak.

---

## 3. Where a language model helps and where it hurts

**It hurts when it holds the truth.**
- **Fair play:** fair play doesn't come out of a prompt (2507.13841). Up to 6 of 10 stories per model had no clue advantage, and it did not improve with size.
- **Fact loss:** writing a whole story from a fact set drops facts. MuSR kept 62% of leaf facts single-pass, and a one-shot prompt produced spurious solutions.
- **Interrogation drift:** in [Structured Knowledge Trees](https://arxiv.org/html/2609.23043) (Rahmati & Zhao 2026; opened), an LLM-only suspect produced critical hallucinations in **17.8%** of replies. **57.9%** of those were *unauthored false alibis*, and **10 of 33** players talked it into a full confession. With a JSON knowledge tree (prerequisites, `Contradicts_With`, a verifier model) the rate fell to **6.27%** and no one got a confession, at a usability cost from forced reveals.
- **Contradiction:** Vaudeville's suspects contradict each other (see `prior-art-interrogation.md`).

**It helps when it words what code decided.**
- **MuSR:** facts and their entailment come from code, the model writes one chapter at a time, and validators stop shortcuts. Humans then solve 92%.
- **Das Verhör** ([Werle, Sept 2026](https://hackernoon.com/i-ship-an-ai-written-detective-case-every-day-but-the-ai-doesnt-know-who-did-it); opened):
  - A Swift engine owns facts, timeline, alibis, the contradiction and the culprit. "The model never receives the solution," and canned text stands in when no model is available.
  - Eight gates, one of which, **G4**, plays three simulated investigators 500 times each (1,500 plays). The weighted solve rate must fall between 0.50 and 0.78, and failing cases are thrown away, not patched.
  - A conflicting worked example in a prompt failed 16 of 20 candidates; fixed, 0 of 22.
- **Our project already does this for lines:** `talk.js` hands a voice only facts from the speaker's frame, and `truthCheck` validates the result. [RoleFact](https://arxiv.org/html/2406.17260v2) warns that checking dulls the replies.

**Where a model is genuinely useful in *making* a case:** period-plausible names and the texture of a role ("the Wynstanton schoolmaster's son"); voice notes and phrase lists; each claim's `line`/`press`/`yield` from its triple; the body text of papers (the settlement, the gold note) from a list of facts they must and must not contain; and **hooks** for clues. All of these are narrow, done one fact at a time, and checkable against the triples. A model is not needed, and is risky, for choosing culprit, motive, timeline, who saw whom, or which clue breaks which lie.

---

## 4. Recommendation: seed → case JSON

**The shape.** Code makes the truth and derives everything checkable from it. Our own checks gate it. A model, when present, only writes words for facts it is handed one at a time. This follows MuSR (truth then words), mystery-o-matic and Shadows of Doubt (the timeline produces the clues), Das Verhör (gates and discarding), and Ryan (overgenerate and curate). It also matches the line in `boundary-with-construct.md`: construct owns story and voice, while holo-emitter owns place, play and the checks. The words stage is the natural place to hand to construct.

**Stages** (all code unless marked):

1. **Seed.** Period, program and plan (we have `planHybridE` with `GENTRY_SEAT_1660`), cast size, shape, RNG seed.
2. **Household.** Fill roles from a period table (master, lady, heir, steward, clerk, guest, servants), with relations and secrets on ClueGen's −3…3 scale and its loyalty thresholds. Each person gets **one secret of their own** from a period list (debt, a plea, drink, a liaison), so innocents have reasons to lie.
3. **Crime core.** Pick victim, culprit and motive from a period **History** table (ClueGen's Histories; ours would read "found the cheat he was paid to write"). Pick the means from catalogue kinds present in the room. Apply **MuSR's distractor rule**: every other suspect holds two of means, motive and opportunity plus one suspicious fact.
4. **The evening.** A discrete-event schedule simulation over the real plan, at 5-minute ticks or intervals:
   - **Routines** from role templates (supper, cards, bed by the back stair, the opiate at nine).
   - **Doors and locks** use `reach.js`'s rules and the door state.
   - **The culprit's act** is injected as a goal: be alone with the victim in the window. Generate and test, re-drawing the seed until it is possible, as mystery-o-matic does.
   - **Object moves** (candlestick, key, draft) are logged as events.
5. **Sightings.** Derived from co-presence plus declared **sightlines**: an open door between rooms; a stair seen from a room; hearing between adjacent rooms, with `sound.js` as a lead. Emit positive *and* negative sightings (mystery-o-matic). Salience from relation and role decides what is remembered (Talk of the Town), deterministic per seed. Each person's frame is their own itinerary plus what they saw, which is pattern-buffer's knowledge frames made concrete.
6. **Testimony.**
   - **True claims** are frame facts as triples.
   - **Lies:** for each person with something to hide in the window (culprit, plus people with secrets), transform their itinerary by *truncate / substitute / advance / omit-sighting / shift-other*. `broken_by` is computed as the sightings and physical traces that contradict the lie.
   - **Rejection:** reject any lie with no breaker, and any lie whose only breaker comes from the culprit.
7. **Traces.** Physical clues come from a trace table keyed by act and means (blow → wound, dented candlestick; cut cord → cord on key; scraped skin → rasure). They are placed as things using catalogue kinds, and assigned to pillars and gates.
8. **Gate (existing plus new checks).**
   - **Existing:** `checkCase`, `fairPlay`, `reachability`, `checkNarrator`.
   - **Uniqueness:** no innocent is covered on every pillar by reachable genuine clues (murdererer, MuSR's Φ).
   - **Anti-leak:** the culprit is not the only liar, and not an outlier in clue count. This is MuSR's longest-chapter baseline and ClueGen's lesson.
   - **Solve-rate band** from scripted investigators (Das Verhör G4). `case-play`'s scripted path is the start.
   - Each new check goes to Kabe to vet before it joins the tests.
9. **Curate.** Make N evenings per seed and score them for drama: number of lies, crossing testimonies, a red herring with a debunker. Felt-style patterns (Winnow's ideas, not its code) can sift for named shapes such as "the guest who was trusted". Keep the best.
10. **Words** (narrow model, optional; construct's side). Generate names, voice notes, and each claim's `line/press/yield` from its triple. Generate papers' texts from must/must-not fact lists. Check every result with `talk.js truthCheck`. With no model, use period templates. The game must play without a model.

**Adopt / reject.**

| Adopt | Reject |
|---|---|
| MuSR's facts → validators → chaptered words, and its two-of-three distractor rule | an LLM drafting the case or the timeline (2507.13841, Generative Agents, SKT) |
| mystery-o-matic's trace → arrival and departure sightings, positive *and negative* (ideas only, AGPL) | random misinformation as lies (Talk of the Town's admitted weak point) |
| Talk of the Town's evidence-typed beliefs with source, place and time, and salience | probabilistic sighting (MuSR's 0.33): a fair case needs stated, checkable reasons |
| ClueGen's Histories, loyalty-to-lie, and its leak lesson | fingerprint-style single smoking guns (SoD's complaint) |
| Das Verhör's gates, solve-rate band, discard-not-patch, and keeping the solution from the model | Ceptre/MCTS emergence for the core crime: rich but unsteerable, and no fairness |
| Ryan's overgenerate and curate; Felt/Winnow-style sifting (ideas only, no licence) | ASP or a planner for v1: a household of 6 doesn't need it (Siler & Ware: specialised search is faster) |

**The smallest first experiment (no model, about a day).**

Re-derive the steward case's night from a schedule and compare it with what was written by hand.

1. **Encode** 28 Sept 21:00–01:00 as interval schedules for Hollins, Daniel, Anne, Francis, Cressy, Sir Gervase and Ralph on the real `hybrid-e` plan. Take it from `canon.timeline` and each person's `night`. Declare three sightlines: great parlour ↔ stair hall (door open "for the fire"), buttery door ↔ screens passage, nursery door ↔ back-stair landing.
2. **Simulate.** Emit positive and negative sightings per 5-minute tick.
3. **Derive** each person's true whereabouts claims. Derive the lies by the transformations above, given each liar's secret window: Daniel 21:40–23:35, Anne 21:50–22:10, Francis 23:15–23:35, Cressy's sighting of Daniel at 23:20.
4. **Compare** against the hand-written `claims` (`dc_half_ten`, `ac_nursery`, `fc_abed`, `cc_daniel`, `cc_sat`, …) and their `broken_by`. Report:
   - which hand-written whereabouts claims and breakers the simulation reproduces;
   - which it misses (authored judgement the simulation lacks);
   - which *extra* sightings it produces, which could either be new breakers or leaks that would give the case away;
   - milliseconds per run.
5. **Then** run `fairPlay` on the case with the derived claims swapped in.

A second step, still small: swap the culprit to Francis with the same household, regenerate the evening and testimony, and see whether the gate passes or fails, and why. That is the first real "generated case".
