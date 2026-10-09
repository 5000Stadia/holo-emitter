# What case-1660 now carries (for pattern-buffer and construct, 2026-10-08)

pattern-buffer's probe of `case-1660.json` (its branch `research/case-1660-probe`, `evals/case_1660_probe/REPORT.md`)
found nine gaps, S1 to S9: facts had no identity, lies had no machine link, some knowledge could never be asked about,
and positions and times were only in prose. We said we would adopt four fixes, and they went in first (sections 1 to 4).

A second round followed the same day (sections 5 to 9). Its sources were pattern-buffer's re-probe (branch
`research/case-1660-probe-r2`, `build2.py` and `ask2_output.json`) and our own case-generation study (branch
`study/case-sim-2026-10-08`, `design/case/case-sim-2026-10-08.md`).

Both rounds are additions. Everything that read the case before still reads it unchanged; the intent eval's output
is identical. The case is `design/case/case-1660.json`, with a byte-identical copy at `lab/case/case-1660.json`.
Field notes are in its `_schema` and `timeline._what`. `node tools/check-case.mjs` (check 26) holds all of it.

## 1. Facts, each stated once (S1, S3)

There is a top-level `facts` list: 95 propositions, 78 true and 17 false. Each is `{ id, text, triple, truth }`.
`truth: true` is canon. `truth: false` is either what a liar says or what a misleading truth suggests. Each of the 27
`canon.facts` triples is the triple of exactly one fact.

Every clue, claim and `knows` entry points at its fact with `fact_id`. It keeps its own wording, so lines and hooks
are unchanged. `also` lists any other facts its words state. For example, Dame Anne's `anne_wound` states
`wound_round_back` and also `chest_corner_square`. On a claim, `yield_fact` names the truth that the claim's yield line
admits once the lie is broken. `dc_gold`'s yield, "Mr Cressy gave it me", owns `cressy_paid_daniel`.

An item's `triple` is its own wording. **The fact's triple is the proposition.** Read the fact when you need one
triple per proposition.

**Why the field is `fact_id` and not `fact`:** `fact` on a clue or claim is already the plain statement that talk.js
hands to a voice. Renaming it would break play. If talk.js later reads `text`, the two fields can be merged.

## 2. Lies point at the truth they deny (S2), and lies are told apart from misleading truths (S7)

```json
{ "id": "dc_half_ten", "topic": "whereabouts", "false": true,
  "fact_id": "daniel_left_2230", "contradicts": "daniel_stayed_till_2318", "yield_fact": "daniel_stayed_till_2318",
  "broken_by": ["francis_no_one_down", "cressy_saw_daniel", "francis_saw_daniel"] }
```

Every lie has `contradicts` and its breakers. That covers all 15 claims with `false: true` and the 3 lie clues.
A clue's `effect: "false"` stays as it was, because fairPlay reads it. The four such clues now also carry a `kind`:

- **`lie`:** the fact is false and the teller knows it. Daniel's half past ten, his key by the hand, and Cressy on the
  stair.
- **`misleading`:** the fact is true, and `suggests` names the false fact it points towards.

```json
{ "id": "anne_francis_blood", "effect": "false", "fact_id": "francis_blood_0100",
  "kind": "misleading", "suggests": "francis_killed_hollins",
  "debunked_by": ["buttery_glass", "cressy_francis_buttery", "francis_saw_daniel"] }
```

The other two misleading clues are Francis naming Dame Anne (`suggests: anne_last_with_hollins`) and the London copy
of the draft (`suggests: no_exception_agreed`). `no_exception_agreed` is the same false fact that Cressy's lie
`cc_mines` states.

## 3. Nothing is unaskable by accident (S4)

Every clue has a topic. A person's clue gets it from its gate. A clue held by a thing has `topic`: the matter it
bears on, used when it is shown or asked about.

Every `knows` entry has one of two things:

- a `topic`: the check confirms that some clue or claim of that person, on that topic, states the fact (or owns it in
  a yield). 66 of the 79 entries have one.
- or `untold` with a reason. This applies to the other 13, for example:

```json
{ "id": "kd_cut_key", "fact_id": "daniel_cut_key", "untold": "the rope: the key's cut cord and the girdle cord show it", "how": "saw" }
```

The dangling `thing:draft` in `cc_mines` is now `thing:draft_steward`. Every `thing:`, `person:` and `room:` named in
a triple is checked to exist.

## 4. Positions and times as data (S5, S8)

**`timeline.intervals`** has 58 entries of the form
`{ who, from, to, room, via?, doing, seen_by?, saw?, chosen? }`. Times are ISO local times, in the Julian calendar.

**Every interval is half-open, `[from, to)`.** An instant `t` is inside an interval when `from <= t < to`. Placements
and the check both use this rule (section 5).

- **Coverage.** The evening of 28 September, from 21:00 to 01:00, has no gaps for Daniel, Cressy, Francis, Dame Anne
  and the steward. The morning may have gaps. Sir Gervase, Ralph, Margery and Ned are also in the timeline.
- **`via`:** the rooms passed through, in order, on the way in from the previous room. Each step is checked against
  the rooms graph's doors and stairs.
- **`seen_by` / `saw`:** a sighting, declared at both ends. Both people must be in the same room, or across one of the
  declared sightlines while its door stands open (section 8).
- **`chosen`:** marks an interval where canon is silent and the case picked something. Examples are the steward and
  Daniel in his chamber before 21:40, and Dame Anne in the nursery before her visit.

```json
{ "who": "daniel", "from": "1660-09-28T23:19", "to": "1660-09-28T23:21", "room": "great_stair",
  "via": ["best_bedchamber", "withdrawing_chamber", "great_chamber", "stair_landing"],
  "doing": "comes down, his candle shielded; sees Mr Cressy at the table see him",
  "seen_by": ["cressy"], "saw": ["cressy"] }
```

**`rooms`** gives `graph: "lab/case/rooms-1660.json"` (the plan's 35 rooms, 32 doors and the stair flights), the 26
rooms this case uses, and 4 sightlines. Each sightline now names the door it looks `through`:

| sightline | through |
|---|---|
| the parlour and the great stair | `d14`, the parlour door |
| the buttery and the screens passage | `d4`, the buttery door |
| the nursery and the back-stair landing | `d27`, the nursery door |
| the closet and the muniment room | `d21`, the muniment door |

**Placements.** A fact's positions and times are placements, held against the timeline:

- `at: [{who, room, from, to}]`
- `absent: [{who?, room, from, to}]`
- `seen` and `unseen: [{who, by, from, to}]`
- **new:** `held: [{thing, by | place, from, to}]`, held against the things' timeline (section 7)

All placements of a true fact must hold. A false fact's placements must not all hold. So a lie about where or when
fails on the timeline, and the truth it contradicts holds there:

```json
{ "id": "daniel_left_2230", "truth": false, "at": [{ "who": "daniel", "room": "great_stair", "from": "1660-09-28T22:30", "to": "1660-09-28T22:30" }] }
{ "id": "daniel_stayed_till_2318", "truth": true, "at": [{ "who": "daniel", "room": "muniment_room", "from": "1660-09-28T21:40", "to": "1660-09-28T23:18" }] }
```

A fact that names a clock time but has no placement must say why in `unplaced`. `key_by_hand` no longer needs one: it
is placed on the key's timeline now.

## 5. The minute of ten is inside the timeline (re-probe item 1)

`gervase_asleep_now` and `household_this_morning` are instants at 10:00. Every morning interval used to end at 10:00.
Under `[from, to)`, those instants fell inside none of them.

**The fix is in the intervals.** The 9 intervals that ran up to play now end at 10:01. `timeline.morning` is
`{ from: 05:25, to: 10:01, play: 10:00 }`. `play` is the minute the justice arrives and play opens. A query at 10:00
now answers for everyone, and a fact placed at 10:00 lands inside one interval. The facts keep their times.

At `play`, the check holds three more things against where play starts:

- each suspect is in their `home` room;
- each thing on the timeline is where `things` puts it (`at` and `rel`), with the same state;
- the muniment door is unlocked, as in `doors`.

## 6. Every frame is complete (re-probe item 2, and more)

**A liar knows what he denies.** Each lie's `contradicts` is now in the liar's `knows`. These were missing:

| liar | lie | the truth it denies | its knows entry |
|---|---|---|---|
| Daniel | `dc_half_ten` | `daniel_stayed_till_2318` | topic `whereabouts`: `dc_half_ten`'s yield now owns it (`yield_fact`) |
| Daniel | `dc_fall` | `hollins_died_of_blow` | topic `death`: his confession now lists it in `also` |
| Daniel | `dc_deed` | `rasure_skin2` | `untold`: he owns a scraped "blot", never that it passes the mines |
| Daniel | `dc_mines` | `draft_margin_exception` | topic `mines`, through the existing yield |
| Daniel | `dc_cressy` | `cressy_sat_parlour` | `untold`, `how: inferred`: he saw Cressy at the table at 21:38 and 23:20 |
| Cressy | `cc_deed` | `rasure_skin2` | topic `deed`, through the existing yield |

pattern-buffer counted 4 of Daniel's. The check found the fifth, `dc_mines`, and Cressy's.

**Everyone knows what they tell.** Every fact a person tells now has to be in their `knows`. That covers a clue or
claim that is no lie, what it lists in `also`, and a yield. 23 entries were missing; they are added, with the topic
of the item that tells them. `knows` is now each person's whole frame, so an S9 overlay can be built from it.

## 7. Things on the timeline (re-probe item 3)

**`timeline.things`** has 26 stints in the people's shape: `{ thing, from, to, holder | place, rel?, by?, doing,
state?, chosen? }`.

- **`holder`** is a person.
- **`place`** is a room, or a thing it is in or on.
- **`by`** says who put it there.
- **`state`** uses works.js names.

A thing the house doesn't build is declared in **`timeline.unbuilt`**: the gold (with Cressy's note), and Sir
Gervase's door key.

| thing | its story |
|---|---|
| `key_steward` | the steward's girdle (to 23:16); Daniel's sleeve (23:16 to 06:15); the floor by the hand (06:15); the table, laid there by Daniel (06:16 on) |
| `key_d21_lord` | the nail at Sir Gervase's bed-head; Ralph from 05:55, who unlocks the door at 06:15 |
| `key_chest_steward`, `key_chest_lord` | the table's drawer and the japanned cabinet, all night: the padlock keys never move |
| `engrossment` | the steward's chamber; Daniel carries it up (21:37); the muniment table (21:40); Cressy takes it (07:15); the draw-table (07:16 on) |
| `draft_steward` | the same way up; the table; Daniel takes it after the blow (23:16); his chest (23:33 on) |
| `desk1_candle` | the table, out, then lit (21:40); in Daniel's hand for the blow (23:05); on the flags before the press (23:06); back on the table, crooked (23:12 on) |
| `gold` | Cressy, then Daniel, in the stable yard on 25 September; Daniel's box from then on (the hour is `chosen`) |

```json
{ "thing": "key_steward", "from": "1660-09-28T23:16", "to": "1660-09-29T06:15", "holder": "daniel", "rel": "sleeve",
  "doing": "cut from the girdle cord with Daniel's penknife; ...", "chosen": "the minute of the cut, between the blow at 23:05 and the locking at 23:18, is the case's choice" }
```

A thing's room at any minute follows from its stint:

- with a `holder`, it is the holder's room on the people's timeline;
- with a `place`, it is that room, or the room of the thing it is in, followed down to a room.

So "where was the key at 23:20" and "who held it" have different answers: the great stair, and Daniel. pattern-buffer's
E6 conflated these.

**Facts placed by things.** `held` placements are on six facts:

- `daniel_cut_key`, `daniel_locked_door` and `daniel_planted_key`: the key's custody;
- `daniel_hid_draft`: the draft into his chest at 23:33;
- `cressy_took_engrossment`: the engrossment in Cressy's hands at 07:15;
- `key_by_hand`, the false one: the key on the muniment floor from 23:18 to 06:15. It fails, because Daniel held it.

## 8. Door states, and the nursery door (study item 5)

**`timeline.doors`** has 11 states: `{ door, from, to, state: open | shut | locked, by?, doing, chosen? }`. Doors are
named by their opening id in the rooms graph.

- **`d27`, the nursery door,** is shut from 21:00 to 00:58, open from 00:58 to 01:10 while Dame Anne stands in it at
  Francis's singing, then shut. Canon is silent, so this is `chosen`, and the case rests on it. Had the door been open
  from 22:12, Dame Anne would have seen Daniel come up the back stair at 23:30, and her first answer would solve the
  case (study, Finding 4). Her lines are consistent with a shut door: she speaks only of Francis "after one, singing".
  Her 22:12 interval now says she sits up within, the door shut.
- **`d21`, the muniment door,** has its lock history as data:
  - 21:40: locked from within by the steward;
  - 21:50: unlocked to let Dame Anne in (`chosen`);
  - 22:10: locked after her;
  - 23:18: locked from the closet side by Daniel, who has the key;
  - 06:15: opened by Ralph, and left unlocked.

  These are the 5 rows pattern-buffer transcribed by hand.
- **`d14`** (the parlour door) is open 21:00 to 01:00. **`d4`** (the buttery door) is open 23:17 to 23:32. **`d30`**
  (the gallery's west door) is locked 21:00 to 06:00.

**What the check holds:**

- A sightline `through` a door holds only while that door is open. Shut the nursery door at one, and Dame Anne's
  sighting of Francis fails.
- No one walks through a door that is locked both before and at the move, unless they hold a key to it. The key is
  found by matching the door's `doors[].key` with the thing's `key`, on the things' timeline. Daniel's exit at 23:18
  passes, because he holds the steward's key from 23:16.

## 9. One value per subject and predicate (re-probe item 4), and how each thing was learned (S6 in part; study items 6, 7)

**Collisions.** Five subject-and-predicate pairs were given two values. Each is now resolved:

| subject, predicate | resolved by |
|---|---|
| `person:francis saw` (×3) | `francis_saw_purse` is now `saw_hand_over`; the other two are placed at 21:39 and 23:25, apart in time |
| `person:hollins kept` | `hollins_taught_daniel` is now `[person:daniel, taught_by, person:hollins: ...]` |
| `person:hollins died_of` | a declared contradiction: Daniel's lie `dc_fall` against the truth |
| `person:cressy paid` | a declared contradiction: Cressy's lie `cc_gold` against the truth |
| `person:cressy saw` | a declared contradiction: Cressy's lie `cc_daniel` against the truth |

**The collision rule.** Two facts may give one subject and predicate two values only in two cases:

- **Apart in time:** their placements' windows don't overlap.
- **A declared contradiction:** a lie and the truth its `contradicts` names, or a misleading truth and what it
  `suggests`.

A lie shares its truth's subject and predicate on purpose, because that is what makes it a contradiction. Renaming
one would hide it. In a frame-scoped store the two sit in different frames: canon, and the liar's says frame.

**`how`, on every `knows` entry:**

| how | meaning | entries |
|---|---|---|
| `saw` | first hand: saw or heard it happen, or did it | 59 |
| `told` | heard it said; `from` names who said it (a person, or "the household") | 10 |
| `inferred` | worked it out | 3 |
| `routine` | the household's habit | 7 |

The study's five are no longer `saw`:

- Cressy on Francis's cut in the buttery: `told`, from Francis.
- Dame Anne on Sir Gervase's sleeping all night: `inferred`.
- Dame Anne on Daniel keeping the door: `inferred`.
- Francis on the gallery lock: `routine`.
- `household_this_morning`: `told`, for all four.

**A `saw` is held to the timeline.** The knower must have been in sight of every placement of the fact, in the same
room or across an open sightline:

- for a span, all of it;
- for an instant, at it, passing through, or leaving.

Their own position and their own absence count as seen. If any of the five above is set back to `saw`, the check
fails it.

**Francis's breaker (study item 6).** `francis_cressy_sat` now points at a new fact, `cressy_sat_till_2315`: Cressy at
the parlour table from 21:00 to 23:15, Francis with him. That is what its own words say ("till I went down for wine
past eleven"), and it is all Francis saw. It still breaks Daniel's "Cressy on the stair at half past ten". The lie's
`contradicts` stays `cressy_sat_parlour` (21:00 to 01:00), the canon truth. Point Francis's knows entry back at that
fact, and the `saw` rule catches it: he was at the buttery from 23:15 to 23:35.

## What the check holds (check 26, about 16 ms for the schema, 50 ms in all)

- Every fact referred to exists, and its truth fits what refers to it.
- Every lie has `contradicts` and its breakers. If a lie is placed in time, so is its truth.
- Every topic is real. Every `knows` entry is told on its topic, or is untold with a reason.
- **Every person's knows holds what they tell, and the truth each of their lies denies.**
- Every name in a triple is real.
- The evening is covered without overlaps, and moves go only through doors and stairs, **never through a door locked
  across the move without its key**.
- Every sighting is mutual and within sight, **its door open**.
- The placements hold on the timeline when true and fail when false, **with every instant half-open**.
- **Things:**
  - each stint has one holder or place, and stints don't overlap;
  - a holder is on the timeline while holding;
  - each hand-off is made in one room, by someone who is there;
  - at play's opening, each thing is where play starts it.
- **Doors:** each is a real opening, with one state at a time, and the play state matches `doors`.
- **People at play** are in their home rooms.
- **No subject-and-predicate collisions** without a time between them or a declared contradiction.
- **Every `knows` entry has `how`.** A `saw` had the knower in sight of every placement.

Round 1 planted 22 faults, one per rule, and every one was caught. Round 2 planted 24 more, one per new rule, and every
one was caught:

- the 10:00 boundary;
- a liar missing his truth, and a teller missing what he tells;
- ten faults on things;
- the steward's two "kept" facts;
- six on doors, sightlines and play;
- Francis's breaker on the over-claiming fact;
- a missing `how`, a false `saw`, and a `told` from no one.

The new rules also find the original problems in the case as it was before round 2: the 10:00 instants, the six
missing truths, the 23 told facts missing from frames, the three true-fact collisions, and the 51 entries without
`how`. `node tools/check-case.mjs --src FILE`
checks any file.

## Still open

- **S6: learned-at.** `how` says how a person knows a thing, but not yet when they learned it. The timeline's
  sightings give the moment for many `saw` entries. A `told` or `inferred` entry has no time.
- **S9: overlays.** The frames are still sparse copies, not overlays on canon. Each `knows` list is now a complete set
  of fact ids (section 6), so building it as an overlay is straightforward.
- **pattern-buffer's E1** (`holds` turned into `held_by` without swapping its direction) is still on pattern-buffer's
  side. The facts here keep the case's own verbs.
- **The give-away is not checked here.** The check holds the door data and every sighting against it. Whether an open
  door would have handed a witness the case is a simulation question. `tools/case-sim.mjs` answers it on the study
  branch; that gate goes to Kabe for vetting before it joins the test list.
