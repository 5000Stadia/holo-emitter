# What case-1660 now carries (for pattern-buffer and construct, 2026-10-08)

pattern-buffer's probe of `case-1660.json` (its branch `research/case-1660-probe`, `evals/case_1660_probe/REPORT.md`)
found nine gaps, S1 to S9: facts had no identity, lies had no machine link, some knowledge could never be asked about,
and positions and times were only in prose. We said we would adopt four fixes. They are now in the case, as additions;
everything that read the case before still reads it unchanged. The case is `design/case/case-1660.json`, with a
byte-identical copy at `lab/case/case-1660.json`. Field notes are in its `_schema`. `node tools/check-case.mjs`
(check 26) holds all of it.

## 1. Facts, each stated once (S1, S3)

There is a new top-level `facts` list: 94 propositions, 77 true and 17 false. Each is
`{ id, text, triple, truth }`. `truth: true` is canon. `truth: false` is either what a liar says or what a misleading
truth suggests. Each of the 27 `canon.facts` triples is the triple of exactly one fact.

Every clue, claim and `knows` entry now points at its fact with `fact_id`. It keeps its own wording, so lines and hooks
are unchanged. `also` lists any other facts its words state. For example, Dame Anne's `anne_wound` states
`wound_round_back` and also `chest_corner_square`. On a claim, `yield_fact` names the truth that the claim's yield line
admits once the lie is broken. `dc_gold`'s yield, "Mr Cressy gave it me", owns `cressy_paid_daniel`.

**Why the field is `fact_id` and not `fact`:** `fact` on a clue or claim is already the plain statement that talk.js
hands to a voice. Renaming it would break play. If talk.js later reads `text`, the two fields can be merged.

## 2. Lies point at the truth they deny (S2), and lies are told apart from misleading truths (S7)

```json
{ "id": "dc_half_ten", "topic": "whereabouts", "false": true,
  "fact_id": "daniel_left_2230", "contradicts": "daniel_stayed_till_2318",
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

Every clue has a topic. A person's clue gets it from its gate. A clue held by a thing now has `topic`: the matter it
bears on, used when it is shown or asked about.

Every `knows` entry has one of two things:

- a `topic`: the check confirms that some clue or claim of that person, on that topic, states the fact (or owns it in
  a yield);
- or `untold` with a reason. This applies to 11 of the 51 entries, for example:

```json
{ "id": "kd_cut_key", "fact_id": "daniel_cut_key", "untold": "the rope: the key's cut cord and the girdle cord show it" }
```

The dangling `thing:draft` in `cc_mines` is now `thing:draft_steward`. Every `thing:`, `person:` and `room:` named in
a triple is checked to exist.

## 4. Positions and times as data (S5, S8)

**`timeline.intervals`** has 58 entries of the form
`{ who, from, to, room, via?, doing, seen_by?, saw?, chosen? }`. Times are ISO local times, in the Julian calendar.
Each interval is half-open, `[from, to)`.

- **Coverage.** The evening of 28 September, from 21:00 to 01:00, has no gaps for Daniel, Cressy, Francis, Dame Anne
  and the steward. The morning, up to the justice at 10:00, may have gaps. Sir Gervase, Ralph, Margery and Ned are
  also in the timeline.
- **`via`:** the rooms passed through, in order, on the way in from the previous room. Each step is checked against
  the rooms graph's doors and stairs.
- **`seen_by` / `saw`:** a sighting, declared at both ends. Both people are in the same room, or across one of the
  declared sightlines.
- **`chosen`:** marks an interval where canon is silent and the case picked something. Examples are the steward and
  Daniel in his chamber before 21:40, and Dame Anne in the nursery before her visit.

```json
{ "who": "daniel", "from": "1660-09-28T23:19", "to": "1660-09-28T23:21", "room": "great_stair",
  "via": ["best_bedchamber", "withdrawing_chamber", "great_chamber", "stair_landing"],
  "doing": "comes down, his candle shielded; sees Mr Cressy at the table see him",
  "seen_by": ["cressy"], "saw": ["cressy"] }
```

**`rooms`** gives `graph: "lab/case/rooms-1660.json"` (the plan's 35 rooms, 32 doors and the stair flights), the 26
rooms this case uses, and 4 sightlines. The sightlines are: the open parlour door and the great stair; the buttery
door and the screens passage; the nursery door and the back-stair landing; and the muniment door, open at dawn.

**Placements.** A fact's positions and times are placements, held against the timeline:

- `at: [{who, room, from, to}]`
- `absent: [{who?, room, from, to}]`
- `seen` and `unseen: [{who, by, from, to}]`

All placements of a true fact must hold. A false fact's placements must not all hold. So a lie about where or when
fails on the timeline, and the truth it contradicts holds there:

```json
{ "id": "daniel_left_2230", "truth": false, "at": [{ "who": "daniel", "room": "great_stair", "from": "1660-09-28T22:30", "to": "1660-09-28T22:30" }] }
{ "id": "daniel_stayed_till_2318", "truth": true, "at": [{ "who": "daniel", "room": "muniment_room", "from": "1660-09-28T21:40", "to": "1660-09-28T23:18" }] }
{ "id": "cressy_saw_daniel_only_2140", "truth": false,
  "seen": [{ "who": "daniel", "by": "cressy", "from": "1660-09-28T21:39", "to": "1660-09-28T21:39" }],
  "unseen": [{ "who": "daniel", "by": "cressy", "from": "1660-09-28T21:41", "to": "1660-09-29T01:00" }] }
```

Francis's "no one came down the great stair" is `absent` on `great_stair` from 22:12 to 23:15. The locked gallery is
`absent` on `long_gallery` overnight. A fact that names a clock time but has no placement must say why in `unplaced`;
for example, where the key lay is a thing's position, and the timeline holds only people.

## What the check holds (check 26, about 13 ms)

- Every fact referred to exists, and its truth fits what refers to it.
- Every lie has `contradicts` and its breakers. If a lie is placed in time, so is its truth.
- Every topic is real. Every `knows` entry is told on its topic, or is untold with a reason.
- Every name in a triple is real.
- The evening is covered without overlaps, and moves go only through doors and stairs.
- Every sighting is mutual and within sight.
- The placements hold on the timeline when true and fail when false.

Each of these rules was tested by planting one fault for it: 22 planted faults, and every one was caught.
`node tools/check-case.mjs --src FILE` checks any file.

## Still open

- **S6: learned-at.** `knows` entries have no time at which the person learned them.
- **S9: overlays.** The frames are still sparse copies, not overlays on canon. With `fact_id`, each `knows` list is now
  a set of fact ids, so building it as an overlay is straightforward.
- **pattern-buffer's E1** (`holds` turned into `held_by` without swapping its direction) is still on pattern-buffer's
  side. The facts here keep the case's own verbs.
