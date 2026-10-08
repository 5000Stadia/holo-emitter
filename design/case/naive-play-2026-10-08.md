# A naive player through case-1660 (2026-10-08)

**Question.** Can a player who knows nothing of the solution reach a correct verdict by following only what the game shows? If so, in how many turns?

**Short answer.** Yes for the investigation. The accusation is where it breaks.

- The bot found enough evidence in 79–96 turns.
- It then needed **13 wrong tries** at the accusation in every run.
- The case declares `attempts: 3`, but nothing enforces it. With that limit, every run would have lost.

The direction (leads, chips, cues) gets you to the evidence. It does not get you from the evidence to the words on the accusation sheet.

## How it was played

The bot is `tests/.naive-play.mjs`. It runs on the real page in Playwright: 390×844, touch, WebGPU, `&voice=0`, so no model was called. Each run took about 4–5 minutes of game clock.

**What it reads.** Only what is on screen:
- the notebook view (Open leads with `where` and `now`, persons and their notes and claims, clues, Caught out);
- the panel's chips (label, asked, dry);
- the panel's log;
- `__aim` cues, the thumb button's label (Look, Take, Use, Locked, Talk) and the cue's own words;
- the line at the foot of the screen (`__said`);
- the papers' reader;
- room names on the HUD.

It never reads the case file. Ids are used only as opaque keys.

**How it acts.**
- **Moving.** It teleports with `__place`: to a person (and taps them in the middle of the screen), or to a room.
- **Searching.** It turns on the spot in 30° steps at two pitches, from a grid of standpoints, and samples `__aim` over a 5×4 grid. For each cued thing it faces it, reads the button and presses it.
  - The eye cue first: look, then take or use.
  - Papers are opened and put down.
  - Never: doors, shutters, lights, or anything that would close something.
  - A press's labelled drawers are opened only when the label shares a word with the notebook or the leads, plus two others.
- **Questioning.** It works through the real panel buttons:
  - every chip that is not dry, then asked-but-not-dry chips again, then a press;
  - a press on a claim heard, where an open lead shares its words;
  - a show from the drawer: evidence on the matter it shares most words with, capped at 2 per person per lead and once per item per person. It never shows someone their own words.
- **Choosing what to do.** Servants' and beats' lines that name a person or room come first. Then the top open lead that has something to do. Then anyone with "matters still worth raising". If nothing moves, it waits a minute (`__cp.idle()`).
- **Accusing.** It accuses when the coroner lead opens.
  - It scores each option by its words found in the notebook. Words shared by several options count for less. A struck claim's words count against.
  - It confirms group by group, trying combinations best-first.
  - A rebuttal rules that suspect out.

**What counts as a turn.** One question (ask, press or show), one press on a thing, one move, one minute waited, or one accusation try. Looking around costs nothing.

## Results (final bot, three seeds)

| seed | verdict | turns | investigation turns | questions | acts on things | moves | waits | wrong tries | clues |
|---|---|---|---|---|---|---|---|---|---|
| 1 | solved | 94 | 79 | 56 | 16 | 7 | 0 | 13 | 28 / 47 |
| 2 | solved | 94 | 79 | 56 | 16 | 7 | 0 | 13 | 28 / 47 |
| 3 | solved | 111 | 96 | 66 | 21 | 9 | 0 | 13 | 28 / 47 |

- The coroner lead ("Have I enough…") opened at turn 77, 78 and 93. The bot accused at once.
- Seeds 1 and 2 played the same game. The tie-break seed changes only the order a room is swept in, and the panel's chip order decides the rest. Seed 3's first sweep of the muniment room missed the key and the candlestick, which cost 17 turns.
- An earlier version of the bot needed 134–135 turns with 11–12 wrong tries. Its sweep keyed the forgiving aim's small finds to the table behind them, so it missed the key in 2 of 3 runs. That is a bot fault, since fixed, but it shows how much the table's small things depend on the aim circle.

## Which leads stayed open longest (final runs; turns open)

| lead | s1 | s2 | s3 | why |
|---|---|---|---|---|
| engrossment ("What did Mr Hollins find…") | 65 | 66 | 81 | Raised at turn 12 by Dame Anne's "Cressy went white". It sits below the key and door leads, which kept offering a person to re-ask, so the great chamber came last. |
| francis_blood | 60 | 60 | 77 | Closed only when Francis was finally pressed on his hand. |
| key_by_hand | 44 | 44 | 61 | Needs the key looked at **and then** Dame Anne **pressed** on "This morning at the door" (see 5 below). |
| fled ("Why has the clerk run up to the garret…") | open at end | open at end | open at end | Raised at turn 51–68. Never followed before the coroner lead opened. |
| half_ten / cressy_stair | 35 / 29 | 35 / 29 | 58 / 52 | Waited on the great parlour, Francis. |

## Where it got stuck, and why

1. **The accusation's words are not the notebook's words.** This caused all 13 wrong tries.
   - **When.** The false option, "going up the great stair at half past ten", echoes four clue labels:
     - "Daniel: he left at half past ten"
     - "Daniel: Cressy on the stair at half past ten"
     - "Francis: no one came down at half past ten"
     - the struck claim "down at half past ten"

     The true option, "staying on in the muniment room past eleven", shares only "eleven", and that word is also in "slipping away from the parlour after eleven". The clue that breaks the lie says "screens passage at half past eleven", not "muniment room". When Daniel gives way, he says "It was later", but no clue records it. So the Clues tab lists the lie three times unmarked and never says what is true. The bot tried the lie on 7 of 9 tries for this group.
   - **Why.** The bot held "The rasure on the second skin", "The mines always excepted", "The Asshover drawer and the memorandum" and "Daniel engrossed the deed". The true option, "the steward found the cheat in the engrossment, written for gold", shares no word with any of them except "engrossment". The decoy "the sale would take Dame Anne's jointure" matches the clue "Dame Anne's jointure on Asshover" almost word for word. The true motive was the 5th of 6 tries.
   - **Who.** The suspect blank never takes a seal, because `accusation.supports` has no `suspect` entry. In these runs Daniel's half-past-ten lie was never caught, because he was questioned before Francis. The Caught out tab therefore showed Francis and Dame Anne broken and not Daniel, so the bot ranked Francis first.
2. **The gold was never found, in any of 6 runs (both versions).** `fled` closes on `done:cornered`, that is, on walking in on Daniel at his chest. It does not wait for the chest to be opened.
   - In the earlier runs the bot went, heard "Daniel kneels at his chest with the lid up…", questioned Daniel, and the lead closed. His box was never opened, so `gold_note` and the `gold` lead never came.
   - In the final runs the coroner lead opened first.

   So "written for gold" is never supported in the notebook.
3. **"Enough to lay before the coroner" came too early.** The `gather` beat fires on `covered>=4`. The motive counted as covered by the rasure alone. **Mr Cressy was never questioned in any run**. Of the 19 clues never found, his own (the bribe, the cheat) and Daniel's box are among them. A player told they have enough, with nothing that names the motive's answer, can only guess.
4. **The muniment room's small things depend on the aim.** The key and the candlestick sit side by side on the table under the east window.
   - The final bot missed both on seed 3's first sweep, and `cord_cut` stayed open 43 turns.
   - The earlier bot missed the key in 2 of 3 runs, and `cord_cut` stayed open to the end (129 turns).
   - The room's own hook names "a table under the east window with a key lying on it", but the lead's `where` says only "The muniment room, where the door was locked upon him".
5. **Some chips only Press can open.** Once the key was looked at, Dame Anne's "This morning at the door" lit again (no longer dry). Ask gave the same line as before, and only Press gave "his hand was empty at dawn". The same happened with Francis's "Master Francis's cut hand" and Dame Anne's "Last night" and "The sale of Asshover". A player who asks and hears the old answer word for word will take the chip for dry.
6. **Wrong shows cost three questions, and the panel then forgets.**
   - Each final run made 5–7 shows (11 in the earlier runs). Roughly half closed the person up, for example "The candle fell, about five past eleven" on Daniel's "Last night".
   - The guard wears off only by asking (`GUARD_TURNS = 3`). The bot spent 3 "How he died" questions per guard.
   - Reopening the panel clears the "They have closed up" look, because `open()` resets `S.guarded` and `talkTo` never restores it. A player can't see they are still closed up.
7. **The press's drawer bank.** Every drawer of the north press re-opens "The Asshover drawer" reader, because the whole press is the case thing.
   - A literal thorough player opens about 100 labelled drawers. The earlier bot spent 120 acts there.
   - Matching drawer labels to the notebook ("Asshover") got it down to about 6.
8. **The servants' nudges were never tested.** The bot never stalled (0 waits): some lead always pointed at someone. This run says nothing about the nudge ladder.

## Ranked changes that would have helped

1. **Make the notebook speak the accusation's language.** Each true option should share its key word with a clue that proves it. Each lie, once broken, should stop reading as evidence.
   - Strike broken claims in the **Clues** tab too, e.g. "Daniel: he left at half past ten (broken)".
   - Have Daniel's yield set down a clue such as "Daniel: it was past eleven when he came down; he had stayed on with his master".
   - Relabel the rasure "The mines exception scraped out of the engrossment: a cheat", or reword the option to "…found the mines exception scraped out of the engrossment".

   This would have removed most of the 13 wrong tries.
2. **Decide `attempts: 3`.** Either enforce it (every run here would have lost), or drop it from the case so the sheet doesn't promise a limit it doesn't keep.
3. **`fled` closes on `opened:box_daniel` or `learned:gold_note`, not `done:cornered`.** Its `where` should name the chest ("his chest in the servants' chamber, west garret"). Without it, no player meets "gold".
4. **Hold the coroner lead (`gather`) until each pillar has a support that names its answer.** At minimum, the motive should need `gold_note`, `cressy_bribe` or `cressy_cheat`, not the rasure alone. As it stands the game says "enough" with Mr Cressy never questioned.
5. **Mark Press-only chips.** When a chip is lit only because Press would open something, say so on the chip (a brass outline, or "Press:" before the label, as in the prior-art note's "the justice's line on the chip"). Alternatively, let Ask give it once the gate is open.
6. **The guarded state.** Restore it when the panel reopens (call `panel.guarded(frame.guarded.get(who) > 0)` in `talkTo`). Consider letting it wear off with time or leaving, rather than only by spent questions. Give a wrong show its one-line reason, as already proposed in prior-art §3.
7. **Point `cord_cut` (and `what_struck`) at the table.** For example: "The muniment room: the table under the east window, where the key was laid this morning", and "…the table candlestick". These two leads waited longest on a sweep that missed small things.
8. **Order the Open tab newest first,** or mark a lead whose people and place you have already been to. `engrossment` was raised at turn 12 and followed at turn 74–93, because older leads kept offering someone to re-ask.
9. **Only the Asshover drawer opens the memorandum.** Every other drawer of the north press should be plain, so it doesn't re-open the reader. Optionally, cue the clue drawer alone with the eye, as the half-open one already is.
10. **Seal the suspect blank** once a lie of the culprit's is broken (`supports.suspect`), so the one "you have enough" signal covers all five blanks.

## Limits of this bot

- It never types its own words.
- It reads papers only for their noted line.
- It doesn't parse beat text for *things*, only for people and rooms. A human would hear "a key lying on it" and go to the table.
- Its show and accusation choices are bag-of-words. A human would reason across clues ("he says half past ten, two say no one came down, so later") better on the *when* blank. They would do no better on the *why* blank, where no clue held carries the option's words.
- With seeds changing only the sweep order, three runs are close to one run. For variance, randomise the chip order or the lead pick.

**Files.**
- The bot: `tests/.naive-play.mjs`. Run it with `node tests/.naive-play.mjs --seeds 1,2,3 [--max 420] [--out DIR]`.
- Per-run JSON (log, leads' lives, accusation ranking, receipts) goes to the scratchpad's `naive/run-N.json`.

## After the fixes (rerun, seeds 1 and 3, same bot)

- **Solved in 171 and 178 turns, 31 of 47 clues, 5 wrong tries each** (13 before). Broken lies are struck, the true motive shares its clues' words, and the gathering waits for a clue that names the motive.
- **Daniel's chest:** opening a thing that holds the case's things now says what lies in it. While it stands open, a tap reaches in for what you haven't touched, with a hand cue reading "take out …". By real taps at the chest: Use opens it, Take gives the gold note, Take gives the draft, then Use closes it.
- **The bot still left the garret without the gold.** Its search loop doesn't follow the "take out" cue on a thing it has already used. That is the bot's limit, not the game's. A fourth run then crashed its browser, so there are no numbers for that pass.
