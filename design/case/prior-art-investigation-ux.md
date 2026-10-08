# Prior art: playing an investigation on a phone (M7 / R59)

R59 asks: is living a story like this fun? This note looks at how strong investigation games handle six things: direction, hints, questioning, the notebook, pacing, and clues in a 3D room. For each, it proposes a change to case-1660 that needs **no model**.

It follows `prior-art-interrogation.md` and does not repeat what that note covers: the stance verbs, a lie as a stored statement with a named breaker, Façade-style reading of words, and the Obra Dinn / Golden Idol accusation.

**Sources.** Three read-only helpers gathered them on 2026-10-08. **Opened** means the page was fetched and read. **Snippet** means the page was seen only in a search summary, so treat it as a lead. Some pages would not load: Pope's TIGSource devlog, Thinky's Golden Idol features, Ingold's "Elementary", and the GDC Vault talks. This note claims nothing from them.

**Cost marks.** S = data or a few lines; M = a day or two; L = more.

**What we have today** (`src/make/case-play.js`, `lab/ui/talk-panel.js`):
- a notebook with tabs for people, clues and contradictions;
- topic chips and Ask / Press / Show / Accuse;
- a brass rule when a line is noted;
- cursor icons for take, use, talk and locked;
- a two-group accusation with three attempts;
- narrator beats and clocks;
- receipts.

**What we lack:** save, hints, people's whereabouts, and any list of what is still unproven.

---

## 1. Direction without a marker

**What they do**
- **Obra Dinn.**
  - The book circles where bodies lie, and a newly opened door means "go here". A critic notes the game "doesn't ever explain this to you" ([Intermittent Mechanism](https://intermittentmechanism.blog/2020/09/25/return-of-the-obra-dinn-commentary-and-critique/), opened).
  - The late game sags because newly unlocked fates "don't signal which chapter scene they actually are". HG101 calls this "a huge chore that kills the late game pacing" ([HG101](https://www.hardcoregaming101.net/return-of-the-obra-dinn/), opened).
- **Overboard! (inkle).** From the third run, testers felt lost. inkle added a **Questions** list built from things "perceived but not fully seen", e.g. "Who is inside Carstairs cabin?" ([Game Developer](https://www.gamedeveloper.com/design/how-get-away-murder-overboard), opened).
- **Her Story.** The search box opens with MURDER already typed, and each clip names the next search ([Wikipedia](https://en.wikipedia.org/wiki/Her_Story_(video_game)), snippet).
- **Outer Wilds.** "Avoid explicit signs" and "telegraph where paths lead" by sight, to "remove aimless wandering" ([Mobius](https://www.mobiusdigitalgames.com/news/the-intentionality-of-wandering), opened).
- **Paradise Killer.** You may go to trial at any time, "but in court, you still need evidence" ([MCV](https://www.mcvuk.com/business-news/we-never-wanted-to-force-our-beliefs-and-our-stories-on-you-make-your-own-one-up-theres-so-much-more-power-in-the-imagination-behind-the-development-of-paradise-killer/), opened).
- **Sherlock Holmes Chapter One.** The case file counts an area's clues and ticks them off. The cost is icons that are "hard to keep track of" ([Adventure Game Hotspot](https://adventuregamehotspot.com/review/266/sherlock-holmes-chapter-one), opened).
- **Shadows of Doubt** shows the opposite: "countless dead ends that almost saw me give up" ([GameLuster](https://gameluster.com/early-access-review-shadows-of-doubt-theres-not-been-another-murder-yet/), snippet).

**For case-1660**
- **"What stands open" (S–M).** A notebook tab of open questions in the justice's words. A clue or beat raises each one and another closes it. Data: `opens` and `closes` on clues and beats.
  - `daniel_says_half_ten` raises "Who saw Daniel come down the great stair?"
  - `daniel_says_key_by_hand` raises "Was the key by his hand when the door was opened?"
- **Every lead names a place or person (S).**
  - A pointing answer is noted with where to go: "Francis sat in the great parlour all evening; ask him who came down."
  - The People tab shows where each person was **last seen**. People do move: Daniel flees to the garret.
- **Seed the first move (S).** Dame Anne's panel opens with "How he died" already chosen. Her hook ends on the muniment room, so the first walk has a destination.
- **Show the hour on the HUD after each clock (S)**, so the noon sealing is felt.

## 2. Hints that don't spoil the deduction

**What they do**
- **Golden Idol: checking.** All-or-nothing checks left players with "no idea which of their deductions were correct". Partial credit fixed that but "reduced the difficulty and length", and "players will optimize the fun out of a game" ([Game Developer](https://www.gamedeveloper.com/design/case-of-the-golden-idol), opened).
- **Golden Idol: hints.** The ladder runs from general advice to topic nudges. Players had to win a minigame to unlock a hint, and that was the ladder's most criticised part ([RPGFan](https://www.rpgfan.com/review/the-case-of-the-golden-idol/), opened).
- **Roottrees are Dead.**
  - Its rubber duck steps from "look into this person more" to "search [name] in [periodical]". GameLuster calls it "that elusive happy medium" ([GameLuster](https://gameluster.com/the-roottrees-are-dead-review-all-in-the-family/), opened).
  - Answers lock in threes, and none is accepted without a photo, which defeats blind guessing.
- **Return to Monkey Island.** The hint book "knows where you are", and it is a thing in the world ([Inverse](https://inverse.com/gaming/return-to-monkey-island-interview-pax-west-2022), snippet).
- **Obra Dinn.**
  - Faces unblur once enough is known to name them: the best-evidenced "you have enough" signal.
  - Critics ask for "a single system", and note that confirming in threes still invites guessing the third ([Intermittent Mechanism](https://intermittentmechanism.blog/2024/05/21/confirmation-in-the-return-of-obra-dinn/), opened).
  - Pope tried icon hints and dropped them ([Film Stories](https://filmstories.co.uk/?p=83249), snippet).
- **Botany Manor.** It has no hints. A reviewer was stuck "an hour … I had all the clues" ([Robert Yang](https://www.blog.radiator.debacle.us/2024/04/design-review-botany-manor-as-quiet.html), opened).
- **The Three Clue Rule.** "For any conclusion you want the PCs to make, include at least three clues". Players "will probably miss the first; ignore the second; and misinterpret the third". Stalls are fixed with **proactive clues**: the world comes to the player ([The Alexandrian](https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule), opened).

**For case-1660**
- **The Three Clue Rule fails on `locked` (S).**
  - `accusation.supports.locked` has two routes (`anne_dawn`, `key_cut_cord`), and `lie_key` breaks on `anne_dawn` alone.
  - Add a third route: Daniel's penknife in his oak box, with green silk caught at its hinge. The canon says he cut the cord "with his penknife", but no thing carries that.
  - `fairPlay` should warn when a required pillar has fewer than three genuine supports.
- **Hints in-world, free, and aware of progress (M).**
  - "Your own memorandum": three rungs for each open pillar, computed from `supports` minus what you have learned.
    - Rung 1, general: "You have not asked how the door came to be locked."
    - Rung 2, where: "The key lies in the muniment room; Dame Anne held the light at dawn."
    - Rung 3, what: "Show Dame Anne the key."
  - Hints are read one rung at a time and never cost anything. Each read is logged.
- **One "you have enough" signal (S).** In the accusation sheet, a blank takes a small seal once you hold any genuine support for it. The seal says *proof in hand*, never *which option*. Use this signal only.
- **A proactive clue when the player stalls (S–M).** If ten minutes pass with no new clue, the narrator's `idle` sends a servant whose word points at the nearest unlearned support. Margery: "Master Francis sat by the parlour door all evening, your Worship." `garret_flight` already works like this; make it a ladder.

## 3. Questioning that feels like conversation

**What they do**
- **Ace Attorney.** Takumi split cross-examination "into themes" and the story into "short sections, giving the player more opportunities to make deductions" ([Iwata Asks](https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Professor-Layton-vs-Phoenix-Wright-Ace-Attorney/Professor-Layton-vs-Phoenix-Wright-Ace-Attorney/2-Ace-Attorney-Born-from-a-Backlash/2-Ace-Attorney-Born-from-a-Backlash-850346.html), opened). Players complain that the accepted answers are "too narrow" ([Steam](https://steamcommunity.com/app/787480/discussions/0/2605804632893772111), snippet).
- **L.A. Noire.**
  - Players took wrong turns not because their reasoning was wrong, but because they "failed to properly convey [it] to the game" ([Significant Bits](https://significant-bits.com/l-a-noires-interrogation-system/), opened).
  - The remaster's Good Cop / Bad Cop was "a guessing game". Kotaku's fix is to show the line you'll say before you commit ([Kotaku](https://kotaku.com/the-l-a-noire-remasters-new-dialogue-system-isnt-speci-1820520119), opened).
- **Heaven's Vault (inkle)** is the most usable source here ([Game Developer](https://www.gamedeveloper.com/design/designing-investigate-conversations), opened). It argues against the topic menu where "conversation is complete when all have been clicked":
  - a question exists only while it is worth asking, and leaves every character once answered anywhere;
  - each character brings their **own thread** and raises topics of their own;
  - characters have a fixed patience;
  - choices are curated: priority first, then "limit the final choice to three".
- **Overboard!** "The other characters can't be waiting for you to act the whole time". They "walk in on you … see through your lies" ([Game Developer](https://www.gamedeveloper.com/design/how-get-away-murder-overboard), opened).
- **Pentiment.** An early accusation is remembered for years ([Shacknews](https://www.shacknews.com/article/146276/pentiment-josh-sawyer-no-correct-answer), snippet).

**For case-1660**
- **Chips that know when the well is dry (S).**
  - Dim a chip that has nothing new to give *now* (Ace Attorney's "read" marker). This reveals nothing about the future, and it ends the commonest stall: re-asking everyone everything.
  - Once a fact is learned anywhere, retire its topic from all four people (Heaven's Vault), unless it bears on their own claim.
- **The justice's line on the chip (S).** Show "Press: 'You came down at half past ten. Who saw you?'" rather than a bare "Press". Data: a `line` on each claim.
- **Each person keeps a thread (M).** Every few turns they give one line of their own concern; after some answers they raise a topic of their own ("And will you ask Mr Cressy where *he* was?"). These keep people alive without a model, and the threads double as hints.
  - Cressy wants his seal and his horse.
  - Daniel asks leave to order the papers.
  - Francis hides his hand.
  - Dame Anne watches the stair.
- **A wrong Show gets a reason in their voice (S).** Keep `guarded`, and add one line per person: "A candlestick? There are twenty in this house, your Worship."
- **Patience (S).** After a set number of questions a person turns away ("I must see to Sir Gervase"). Their patience returns once you leave and come back. Show it as a posture beat, never a bar.
- **People move on the clocks (S, data).** At eleven, Cressy goes to lay out the deed. Francis walks in while you question Daniel. Both are closed `move_person` effects.

## 4. The notebook on a small screen

**What they do**
- **Golden Idol.**
  - Placing given phrases in blanks beat building sentences freely. The word bank works as the inventory: holding a word proves you found its clue ([Game Developer](https://www.gamedeveloper.com/design/case-of-the-golden-idol), opened).
  - On phones it is "difficult to read on a small screen" ([mobi.gg](https://mobi.gg/en/games/tests/the-case-of-the-golden-idol-mobile-review/), opened). With a cursor on Switch, moving words was "tedious" ([NWR](https://nintendoworldreport.com/review/69295/the-rise-of-the-golden-idol-switch-review), snippet).
- **Shadows of Doubt.** Its string corkboard shows how incriminating a link is by colour and how reliable by width ([devblog](https://colepowered.com/?p=33958), opened). Players called it "a tangled mess after twenty minutes" and gave up the controller for a mouse ([Quarter to Three](https://forum.quartertothree.com/t/detective-games/120211?page=15), snippet).
- **Ace Attorney.** The court record is a compact grid with each description on tap. The 2012 phone port's buttons "float illogically" ([UX study](https://tenten.co/learning/ux-study-ace-attorney-en/), opened).
- **Lorelei.** Its photographic memory lets you reread any document anywhere ([GamesBeat](https://gamesbeat.com/lorelei-and-the-laser-eyes-review-a-notebook-puzzler-with-spooky-vibes/), snippet).
- **Roottrees.** Sorting notes "can get painful", and its remaster mostly fixed search ([Checkpoint](https://checkpointgaming.net/reviews/2025/01/the-roottrees-are-dead-review-tracing-family-roots/), snippet).

**For case-1660**
- **Structured slots, not strings.** Add two tabs:
  - **People** as a court record: role, where last seen, and their *claims*. A broken claim is struck through, with its breaker beside it.
  - **Papers**: every document read, rereadable in full.

  Rows are tap targets: tap a clue while talking to Show it.
- **Accusation options gated by what you've learned (M).**
  - An option appears only once you hold a clue naming it. For example, "cut from his girdle and dropped by his hand" waits on `key_cut_cord`, `body_cord` or `anne_dawn`.
  - The herrings' options come from the herrings.
  - This carries Golden Idol's word bank over to our multiple choice and makes guessing harder. Data: `from: [clue ids]` on each option.
- **Phone rules (S).**
  - Tap to select, then tap to place; never a long drag.
  - Body text at 16 px or more. The accessibility guidelines call their own size "a minimum rather than a target" ([GAG](https://gameaccessibilityguidelines.com/use-an-easily-readable-default-font-size/), opened).
  - At most about 8 items show before a tap opens one.

## 5. Pacing 30–60 minutes

**What they do**
- **Red herrings.**
  - Escape-room designers call decoys "almost always detrimental"; one says "I never design with red herrings". Players expect the most striking prop to matter ([Room Escape Artist](https://roomescapeartist.com/2019/02/10/red-herrings/), opened).
  - The Alexandrian: players "will become suspicious of at least three other people" on their own ([The Alexandrian](https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule), opened).
  - Golden Idol uses one deliberate decoy and spreads suspicion instead: every suspect has a weapon and a shady trait ([Game Developer](https://www.gamedeveloper.com/design/case-of-the-golden-idol), opened).
- **Golden Idol's thought paths.** One find leads to the next, and clues that let testers skip steps were cut. The failure they name: a player who "understands the main mystery immediately" but is "stuck for thirty minutes on some technicality" ([IGF](https://www.gamedeveloper.com/road-to-igf-2023/-the-case-of-the-golden-idol-i-used-frequent-testing-to-improve-its-mystery-solving), opened).
- **Length and testing.** Golden Idol cases run about 30–35 minutes each, by our arithmetic. Overboard! runs are 10–45 minutes, tested by an autoplayer "thousands of times per hour" (opened, above).
- **Obra Dinn's dead end.** Emily Short: missing a body is "a type of failure state that the game allows" ([emshort](https://emshort.blog/2019/06/06/return-of-the-obra-dinn-lucas-pope/), opened).

**For case-1660**
- **Keep the seven herrings.** They spread suspicion and are not decoys, the Golden Idol pattern.
  - Each should visibly resolve: struck through in People once debunked.
  - The buttery's glass and blood is the most striking object pointing at Francis. It is fair only because `francis_saw_daniel` turns it, so make that turn its own line.
- **Plan the "aha" and time it (S).**
  - The turn is `lie_key`: Dame Anne's light on an empty hand.
  - Targets: the first broken lie by minute 15, the garret by minute 30. Add both times to the receipts.
  - If playtesters miss them, bring Dame Anne's dawn answer earlier rather than adding clues.
- **Save and resume (M).**
  - A phone tab dies at a phone call. Snapshot each turn to localStorage: what's learned and held, what's been said and yielded, who is guarded, beats and clocks, positions, and things opened.
  - On return, show a three-line recap: the hour, what stands open, and where people are. This answers Golden Idol's "forgot the context".
- **Autoplayer (M).** Turn the one scripted play into many randomised walks. Assert that every walk stays solvable, and report the spread of turns rather than one 71.

## 6. Clues as things in a 3D room

**What they do**
- **L.A. Noire.** A soft piano note plays near unfound evidence, and the search theme "only finishes when you have collected all relevant pieces of evidence" ([Game Developer](https://www.gamedeveloper.com/audio/the-musical-box-11-musical-clues), opened). GamesRadar warns the aid can make searching "aimless wandering" (snippet).
- **"Yellow paint".**
  - Developers: in observed playtests, realistic props get missed ([Kotaku](https://kotaku.com/resident-evil-4-remake-design-crate-signposting-obvious-1850238136), opened).
  - Vice: higher detail "actively produces more visual clutter", and older games used lighting and texture tone instead ([Vice](https://www.vice.com/en/article/5d9zbx/resident-evil-4s-yellow-boxes-are-not-a-betrayal-theyre-a-symptom), opened).
- **Arkham's Detective Mode.** Its art director "wanted to cry" when players never turned it off ([TheSixthAxis](https://www.thesixthaxis.com/?p=49991), opened).
- **Crimes & Punishments.** Its best clues are absences, like a dust-free rectangle where a chest stood ([Slant](https://www.slantmagazine.com/games/review/sherlock-holmes-crimes-and-punishments), snippet).
- **Ethan Carter.** Floating text over clues undercut its promise of no hand-holding ([Game Informer](https://www.gameinformer.com/b/features/archive/2014/10/24/afterwords-the-vanishing-of-ethan-carter.aspx), opened; Kill Screen, snippet).
- **Gone Home.** Players "will pick up every piece of crumpled paper" ([Game Developer](https://www.gamedeveloper.com/design/gone-home-and-its-hidden-objects), opened).

**For case-1660**

Every drawer in our house works, so "is this a clue?" is a real question.
- **No glow by default; stage clues by composition (S).**
  - The case already does this: the drawer a hand open, the key under the east window, the scrubbed flags.
  - Make it a rule: each essential clue gets a light and a *state* unlike its neighbours, and the room's beat names it.
- **Sound on learning, and a "searched" mark (S).**
  - A quill scratch beside the brass rule when something is noted.
  - When a room's clues are all learned, the notebook marks it searched, L.A. Noire's ending music.
  - No proximity chime.
- **An optional "bearing on the case" glint, off by default and logged (S).** The Arkham warning is why it stays off.
- **Look frames the detail (M).** The candlestick's foot fills the view. Absence clues (the clean chest band, the scrubbed flags) need a close view and a line naming what is *missing*.
- **Documents (S).** The period hand as an image, with a transcript toggle at 16 px or more.

---

## Top 10 changes for case-1660, ranked

None of these needs a model.

1. **"What stands open"** (§1, cost S–M). Open questions in the notebook, raised and closed by clues and beats; each lead names a room or a person.
2. **Chips that know when the well is dry** (§3, cost S). Dim what has nothing new now; retire a topic everywhere once its fact is learned.
3. **Save and resume each turn** (§5, cost M). A three-line recap on return.
4. **The Three Clue Rule for `locked`** (§2, cost S). A third route (Daniel's penknife with green silk at its hinge), and `fairPlay` warns below three supports.
5. **A free in-world hint ladder, "your own memorandum"** (§2, cost M). Three rungs for each open pillar, from its supports minus what you've learned, each read logged.
6. **Accusation options gated by learned clues, and a seal on blanks you hold proof for** (§2, §4, cost M).
7. **People who keep their own thread and patience** (§3, cost M). Their concern every few turns, a raised topic, patience that returns after you leave, and a wrong Show answered in their voice.
8. **People as a court record** (§4, cost S). Where each was last seen, their claims, and broken claims struck through with their breaker.
9. **Proactive clues on a stall** (§2, cost S–M). Ten idle minutes bring a servant with word toward the nearest unlearned support.
10. **Clue staging and phone legibility** (§6, cost S–M). Composition and light rather than glow, a searched mark, a close view for Look, transcripts at 16 px or more, and an assist that is off and logged.

**For R59's receipts:**
- the minute of the first broken lie;
- the minute of the garret;
- hint rungs read;
- stalls over ten minutes;
- whether the assist was on.
