# Row 13 batch — passage maintains orientation

**Unapproved.** This is material submitted for Kabe's eye, not approved reference: it does **not**
belong in `design/references/`, which the playbook reserves for approved work. **Delete this
directory when his verdict lands**; anything he approves graduates to `design/references/` with its
V-stage, by the hand that receives the verdict.

Eleven captures, the scene canvas element alone at native 1536×1024, cold `file://` load, Chromium,
no chrome (§12.6's capture spec — the frame the flip test and every hash test also read). Grid-mode
placeholder art (V1); nothing here is judged on look. Also published as an
[Artifact](https://claude.ai/code/artifact/8cd27450-b639-46a4-95cc-4b31177a247a) for a laid-out,
captioned read of the same eleven frames — this directory is the material that outlives that link.

| File | State |
|---|---|
| `01-study-N-boot.png` | boot |
| `02-study-E-door-closed.png` | before the toggle that opens the door |
| `03-study-E-door-open-departure.png` | door open, about to leave — study side |
| `04-hall-E-arrival.png` | **the arrival frame.** Facing the direction of travel (east), not turned back to face the door — the row's own change, and the frame where "only the door left the picture" is visible |
| `05-hall-S-intermediate.png` | one turn into looking back |
| `06-hall-W-turnback-door-open.png` | facing the door again — still open, persistence shown from the hall side |
| `07-hall-N-reference.png` | for context: the facing where the coin/shelf actually live |
| `08-hall-W-before-return.png` | door open, about to walk back |
| `09-study-W-arrival.png` | the arrival frame, the other direction |
| `10-study-N-intermediate.png` | one turn into looking back |
| `11-study-E-turnback-door-open.png` | the room exactly as left — key still in the drawer, door still open |

**What to look at, in the order it matters:**

1. **04 and 09, the arrival frames.** Measured against their own departure frame (03→04, 08→09):
   23,946 of 1,572,864 pixels change (1.52%) and 23,587 (1.50%), and in both cases every changed
   pixel is the door itself leaving the frame — `04` is 99.91% identical to plain `hall/S` (`05`).
   At V1, on grid-mode placeholder art, walking through a door currently reads as *the door I
   clicked disappeared*, not *I am in another room*. This is the direct, measured consequence of
   the [HUMAN] ruling this row implements — arrival now faces the direction of travel, away from
   the door, and this two-room fixture has nothing else staged on those facings to say otherwise.
   Real backdrops at row 4 give every facing its own wall, window, or paneling and resolve this
   structurally; flagged here rather than left for the flip test to discover first.
2. **06 and 11, the turn-backs.** This is where "leave a room and return and the world is exactly
   as you left it" is checked by eye, not only by the suite's pre-passage hash comparisons: the
   door stands open on both sides, nothing else in the room has moved.
3. **What is not shown**: the reversal cost. Getting from 04 back to 06, or from 09 to 11, is two
   keypresses — there is no turn-around affordance, only `turn left`/`turn right`. Accepted as the
   ruling's direct consequence; named in `design/architecture.md`'s Known limits, not fixed here.

**The ask.** Row 13 does not leave `design/intention.md`'s spec list until this batch (or the
Artifact) has your yes — the studio playbook reserves that gate for you on any row that changes
what a player sees, and this is measurably one. A reply naming which frames you looked at and
whether the door-vanishing issue in point 1 needs its own row (versus riding row 4's fix) is
everything this gate needs.
