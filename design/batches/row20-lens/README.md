# Row 20 — the lens, and what it did to the two rooms

Fifteen captures and the two redrawn schematics. Every frame is the `#scene` element alone at
native 1536×1024, cold `file://` load, Chromium, `body.capture` (no chrome), nothing hovered,
nothing focused, reached by **real intents through the harness** — turn, toggle, go — never by
writing a viewstate. That is §12.6's capture spec, the same frame every hash test and the flip test
read.

Placeholder art (V1). Nothing here is judged on finish.

**CAPTURE-SRC 0f98884** — the commit whose `src/` these frames were rendered from. It is machine-read
by `plan.spec`, which goes red if `src/` moves and the batch does not, because a batch that no longer
shows what the code draws is worse than no batch: the first version of this one was captured before
the facing glyph was resized, and every frame in it was a picture of code that had stopped existing.

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

`01`–`08` are the eight. `09` is the study with the drawer open and the key revealed; `10` and `11`
are the door standing open from the study side and from the passage side. `12` and `13` are the
redrawn schematics — the standpoints moved, and those two sheets are the drawing that says so.

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

---

## Before the five: the frames you approved are not the frames that ship

The preview pair you blessed — `01d` and `02b` — licensed two things, and only one of them is
still exactly what you saw.

**Unchanged, to the pixel.** How wide a metre of wall draws (235.4 px/m in the study, 170.7 in the
passage), where the corners land (127 and 1409; 546 and 990), and how much of the frame the wall
fills (83.5 %, 28.9 %). Those are the lens and the standpoint, and both are what you approved.

**Changed, and by a later decision of yours.** Your eight backdrops arrived after those previews
and were measured. The one your probe blessed turned out to have been painted from a **lower
camera** than anything this project had drawn — the eye about 1.09 m rather than 1.60 m — and
blueprint §5 rules that the approved image is the geometric authority, so the project now draws at
that camera. The consequence is visible: **the floor is 24 % of the study frame where `01d` showed
15 %**, the ceiling line sits higher, and the frame bottom cuts the floor at **2.23 m** rather than
3.08 m. It is a better picture by the intention's own fifth quality, and it is not the composition
you looked at.

## Question 1, and it is the only one that blocks: two worlds, pick one

Your intention names the eye height in your own words — *"contract §10 — 6 ft, pitched slightly
down"*. The camera now drawing is **3 ft 7 in**. It got there by measurement: the generator was
asked for six feet on all eight backdrops and drew about four on every single one, and blueprint §5
says the approved image is the geometric authority. So this is not a number to correct. It is a
choice between two worlds, and only you can make it.

**(i) KEEP THE PICTURE.** The world you are looking at in these frames. Eye ~1.09 m, the floor
starting 2.23 m ahead, the same camera on all eight facings, nothing regenerates, the batch is
finished art direction. The cost: the intention's parenthetical amends to the measured camera, and
your 6-ft ruling is recorded as superseded by your own approved image — which is the authority
chain you yourself set when you ruled that the approved image IS the camera.

**(ii) ENFORCE SIX FEET.** Your number stands in the intention untouched. The cost: every backdrop
regenerates with the eye fought upward against a generator that has drawn about four feet on all
eight asks so far, for an unknown number of re-rolls, and nothing ships until they land.

**The Navigator's recommendation is (i)**, and the reason is what quality 5 is actually for: its
substance is CONSISTENCY of eye height and rooms that read right, and measurement delivers both.
The number was always a means to *"better visual presentation"* — which the approved frames already
are. Your word decides. Nothing ships before it either way.

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
