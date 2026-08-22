# Row 20 — the lens, and what it did to the two rooms

Eleven captures of the shipped build, a BEFORE frame for each of the eight facings, and the two
redrawn schematics. Every frame is the `#scene` element alone at
native 1536×1024, cold `file://` load, Chromium, `body.capture` (no chrome), nothing hovered,
nothing focused, reached by **real intents through the harness** — turn, toggle, go — never by
writing a viewstate. That is §12.6's capture spec, the same frame every hash test and the flip test
read.

Placeholder art (V1). Nothing here is judged on finish.

**These frames are re-rendered and compared by the test suite on every run.** `capture.mjs` beside them is the script that made them, and `plan.spec` runs it into a temporary directory and requires every frame to come back byte-identical — so a picture here cannot drift from the build, and a frame cannot be swapped for another. This replaced a commit hash typed into this README: a critic pointed out that a guard reading a string in the document it guards is satisfied by editing the string, and that the sentence was already false — it named a commit two changes later than the capture.

---

## What changed, in one sentence

Every direction used to be shot on a different lens. The implied focal length —
`px_per_m_at_wall × the distance to the wall` — ran **187 px to 2014 px** across the manor: a 4 mm
fisheye in the cross passage, a 47 mm normal in the entrance court, eleven different lenses in one
building. It is **1024 px on every facing** now, which is 24 mm on the 36×24 mm format this frame
exactly is, 73.7° across.

Your sentence for it, which is what the row was built against:

> *"the demo first room looks like every direction is a corridor….. That looks like a cross
> junction of long hall rooms or something and user is in the middle. Like a + shape."*

All eight facings carry a before/after pair — `NN-<facing>-BEFORE.png` beside `NN-<facing>.png`.
**Open `01-study-N-BEFORE.png` and `01-study-N.png` side by side first** — that is the whole row in
two pictures. If you look at four, look at these:

| pair | before | after |
|---|---|---|
| the study, north — the first room | `01-study-N-BEFORE.png` | `01-study-N.png` |
| the study, south | `03-study-S-BEFORE.png` | `03-study-S.png` |
| the passage, north — its long wall | `05-hall-N-BEFORE.png` | `05-hall-N.png` |
| the passage, east — the arrival view | `06-hall-E-BEFORE.png` | `06-hall-E.png` |

## The eight facings, and the three states

`01`–`08` are the eight. `09` is the study with the drawer open and the key revealed. `10` is the
door standing open from the study side; `11` is the passage side with the leaf SHUT — worth saying
why, because it was wrong until a critic pushed: you can only reach the passage by opening that
door, so `08-hall-W` already shows it open and the frame that used to be called
`11-hall-W-door-open` was the same picture under a name that promised a different one. Shutting it
on arrival is the state the batch was actually missing. `12` and `13` are the redrawn schematics —
the standpoints moved, and those two sheets are the drawing that says so; they are byte-identical
to `design/plan-draft/manor-{ground,upper}.png`, which a test now asserts.

## The symptom, as a number

The share of the frame taken by **side wall** rather than by the wall you are facing:

| facing | before | after |
|---|---|---|
| study/N | 66 % | **16.5 %** |
| study/E, study/W | 70 % | **21.8 %** |
| study/S | 66 % | **5.6 %** |
| hall/E, hall/W — the corridor | 84 % | **71.1 %** |
| hall/N, hall/S — the passage's long walls | 50 % | **0 %** |

Before, the study and the corridor were one band with no separation between them, which is the `+`
shape stated as arithmetic. After, a room shows a room and a corridor shows a corridor, and a test
fails if a facing of a room that is not a corridor ever shows more side wall than facing wall.

**And `study/S`'s 5.6 % is the smallest number in that column for a reason you should see rather
than infer.** It is the one facing where the room only just ends inside the frame: its wall draws
**94.4 % of the frame width**, leaving **43 px of side wall** on each side against `study/N`'s
127 px — and `study/N` is the frame you approved, the one the preview notes described as reading
like a room *because* "a band of side wall stands beside each corner". `study/S` has a band about a
third that wide. The cause is honest and is not a lens choice: the chimney breast is behind you on
that facing, so you cannot stand back the full way and the standpoint pulls forward from 4.35 m to
3.85 m. **Open `03-study-S.png` next to `01-study-N.png`.** If the south wall reads as pressed
against the glass where the north wall does not, that is a room-shape question — the fireplace, or
where the room is entered from — and it is yours, not a number an agent may retune.

---

## Before the five: the frames you approved are not the frames that ship

The preview pair you blessed — `01d` and `02b` — licensed two things, and only one of them is
still exactly what you saw.

**Unchanged, to the pixel.** How wide a metre of wall draws (235.4 px/m in the study, 170.7 in the
passage), where the corners land (the drawn stroke centres measure 126.0 and 1409.1; 546.0 and 989.1 — the preview notes rounded them to 127 and 990, which is a pixel out in a sentence whose force is "to the pixel", so the measured values are what this says), and how much of the frame the wall
fills (83.5 %, 28.9 %). Those are the lens and the standpoint, and both are what you approved.

**Changed, and by a later decision of yours.** Your eight backdrops arrived after those previews
and were measured. The one your probe blessed turned out to have been painted from a **lower
camera** than anything this project had drawn — the eye about 1.09 m rather than 1.60 m — and
blueprint §5 rules that the approved image is the geometric authority, so the project now draws at
that camera. The consequence is visible: **the floor is 24 % of the study frame where `01d` showed
15 %**, the ceiling line sits higher, and the frame bottom cuts the floor at **2.23 m** rather than
3.08 m. It is a better picture by the intention's own fifth quality, and it is not the composition
you looked at.

## Question 1: answered, and here is what your answer did

Your intention named the eye height in your own words — *"contract §10 — 6 ft, pitched slightly
down"*. The camera drawing these frames is **3 ft 7 in**, because the generator was asked for six
feet on all eight backdrops and drew about four on every one, and blueprint §5 makes the approved
image the geometric authority. That was a choice between two worlds, not two numbers: keep the
picture you approved, or hold everything until a generator that has missed six feet eight times out
of eight finally hits it.

You answered **"Whatever looks good"**, and the Navigator took it as keep the picture. So the
measured camera is the project's camera now, and `design/intention.md` quality 5 reads *"the approved
painted world's measured camera"* — your sentences untouched, only the parenthetical's number moved,
with the chain written into it: §5's approved-image rule, your approval of the painted frames, and
your delegation. **Your 6-ft ruling is recorded as superseded rather than deleted**, so anyone
reading it later can see it was your own approved picture that overruled it, not an agent's
preference.

If that is not what you meant, this is the cheapest possible moment to say so.

## The scored pass, and it did not go the row's way

The row froze six criteria before it changed anything, and required a fresh outside eye to score
before-and-after unlabelled before closing — with the rule set in advance that a criterion the new
frames lose is a finding, not a note.

**Two comparators ran and they disagree.** The first preferred the new frames on four criteria of
six. The second, scoring the frames in this batch, **preferred the OLD ones on all six** and would
ship the fisheye.

Both put the weight in the same place: `hall/N` and `hall/S`, the passage's two long walls, which
show no corner, no floor line and no ceiling line at all. The second one's sentence is worth having
in front of you: *"a treatment that goes blind on 25 % of the passage's facings is not shippable."*
The old camera never goes blind, because it re-zooms every facing to fill the frame — which is
false, and legible.

The full record, including where the second comparator contradicts its own measurements and where
its lens arithmetic is off by a factor of two, is in `comparison.md` beside this file. It is not
resolved here, because it is a look question and those are yours.

## The five things that are yours

**1. Two of the eight are a wall in your face, and they cannot be anything else.** `05-hall-N.png`
and `07-hall-S.png` show no floor line, no ceiling line and no corners. The passage is 2.60 m deep,
and at this lens you see one metre of wall per metre of distance — so from anywhere inside it you
see that wall from 0.48 m to 2.63 m and nothing else. It is honest, it is what standing 2 m from a
long wall looks like, and nothing can be staged on those two facings at any depth. If it reads
wrong to you, the lever is the passage's own width on the plan, not the lens.

**2. The floor still starts two paces away.** `f / px_per_m_at_bottom` is the same on every facing
in the manor — **2.23 m**. It was 3.08 m in the preview frames you approved and 1.04 m under the
old fisheye, so the camera the approved backdrops turned out to be drawn at has bought most of it
back. The intention's *"rails cut by the frame bottom at your own feet"* is still not fully
delivered, and no lens shift at this focal length can deliver it; its other half — *"Kabe's
reference anchors the same way through a near desk surface"* — is what closes the rest, and it
belongs to the row that stages a near surface.

**And one thing this row made worse, which the next row is already lined up to fix: open a door and
you look through it into black.** The opening is a hole in the wall with nothing behind it — 4.4 %
of the frame on the study side, about six times the void the old fisheye showed, at exactly the
point your eye goes (`10-study-E-door-open.png`). That black is what the shipped code draws today
and this batch shows it rather than hiding it. What belongs there is the next room's own painted
wall, and *"through an opening, the destination room's content shows"* is queued as its own row the
moment this one closes.

**3. The passage's furniture moved to its east end wall, and it was forced.** The bookcase and the
candlestick stood against the passage's north wall, which now has no floor to stand on — the
shipped validator refuses any placement there at any depth. They are at the far end of the passage
now, which is `06-hall-E.png`: the view you arrive on. It is a better picture than the bare wall
you used to arrive facing. **One thing to redline if you want it differently**: that end wall
carries your 1.00 m window at its centre, and a 1.0 m press cannot clear it on a 2.60 m wall. The
prompt sheet that paints it either sets the sill above the press's head or you re-site the window.

**4. Turning moves you further than it used to.** Standing back to the far side of a room to see
its corners means **one arrow press now carries you 2.4 m** across a 4.8 m room, where it used to
carry you 1.8 m; the study's opposite standpoints are 3.4 m apart against 2.4 m before, and the
passage's east and west 4.0 m apart. Turning is the thing a player does most. The lens is
one lens now; the position is not one position, and the trade was taken with eyes open: without
standing back, neither frame you approved reproduces. The fix is not a lens change. It is rooms
that name several standpoints outright — so where you stand is a stated fact of the room rather
than something a rule works out from a wall — plus the fiction of travelling between them, which
absorbs the step that a free-look camera cannot hide. That is a later row, and this is the number
that will decide it.

**5. And the smallest thing that will annoy you first: the coin.** On a phone the silver coin on
the passage shelf draws under three CSS pixels and its reachable target is about eleven — a
fingertip is forty. Miss it by seven pixels and you get the bookcase instead, silently. This row
made it better (it was seven pixels of target before) and it is the row that was meant to close
it, because the reason it was left open was the camera question this row answers. It is now a
question of how big the objects themselves are, which is the asset work.

**6. The schematics say APPROVED and also say what they are waiting for.** `12` and `13` carry a
stamp reading *"APPROVED 2026-08-21 … AWAITING HIS EYE ON: the standpoint markers and their printed
distances"*. The anchor rests on your approval of the preview frames `01d` and `02b` — those two
frames ARE the standpoint rule stated in pictures, one at the threshold and one at the drawn
distance — but you have not seen these two sheets, and the stamp says so on its own face rather
than claiming more than it has.

---

## Which facings are painted, and which are still grid

**None of them yet — every frame in this batch is the schematic.** Saying otherwise would be the
one thing this row exists to prevent, so here is exactly where the painted world stands.

**`study/N` is the one backdrop ready to go up.** The frame your own probe approved is the only one
whose painted camera and this row's ruled lens are the same camera — measured 1010 px against the
ruled 1024, 1.4 % apart. It is not on screen yet because hanging it is not a one-line change: the
painting's own geometry differs slightly from the plan's (it draws a 5.37 m wall from 4.41 m where
the plan says 5.45 m from 4.35 m), so the room's objects re-site to the picture and every test that
pins that facing's corners moves with them. That is real work and it belongs in front of an
adversary, not after the last one has gone home.

**The other seven are grid**, and the reason is not a delay. The asset seat regenerated all seven
with the camera enforced and **none of them passed the gate**: the three study facings measure 4.6 %,
5.1 % and 24.2 % short of your approved camera, and none moved materially from the previous
attempt. The four passage facings were not given a verdict at all, because the measuring harness
could not be trusted on them — pointed at the new images it reported a 5.38 m ceiling in a 2.80 m
room. A number that describes an impossible room is measuring something other than the room, so it
is recorded as WITHHELD in `design/plan-draft/measured/miss-ledger.json` rather than quoted at you.

So what you are looking at is a world that is **true everywhere and painted nowhere** — every room
correct in its geometry, none of it dressed. The paint boards from the phase that processes sprites:
`study/N` first, since it already agrees with the camera, and the other seven as they pass the gate.

## And the thing that is not in this batch yet

**The painted world.** Your eight backdrops arrived and were measured off their own pixels. The one
your probe loop blessed — the study looking north — was painted at **1010 px of focal length
against the ruled 1024**, 1.4 % apart, which is measurement error: the picture you approved and the
lens the row pins are the same camera, and that is the strongest single result in the row.

The other seven are not. Measured, they run **498 px to 973 px** — eight different cameras in one
building, which is the same defect this row removes, arriving from the art side rather than the
code. The passage's north and south paintings depict a room 4.01 m and 3.54 m deep where your plan
says 2.60 m. So they go back for regeneration with the camera stated, and the measurement harness
is their gate: a candidate is admitted at ±3 % of that 1010 px. The painted eight come to you as
their own batch when they agree.
