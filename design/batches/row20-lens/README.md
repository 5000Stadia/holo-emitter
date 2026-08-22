# Row 20 — the lens, and what it did to the two rooms

Fifteen captures and the two redrawn schematics. Every frame is the `#scene` element alone at
native 1536×1024, cold `file://` load, Chromium, `body.capture` (no chrome), nothing hovered,
nothing focused, reached by **real intents through the harness** — turn, toggle, go — never by
writing a viewstate. That is §12.6's capture spec, the same frame every hash test and the flip test
read.

Placeholder art (V1). Nothing here is judged on finish.

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

Four pairs carry the before/after. **Open `01-study-N-BEFORE.png` and `01-study-N.png` side by
side first** — that is the whole row in two pictures.

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

## The five things that are yours

**1. Two of the eight are a wall in your face, and they cannot be anything else.** `05-hall-N.png`
and `07-hall-S.png` show no floor line, no ceiling line and no corners. The passage is 2.60 m deep,
and at this lens you see one metre of wall per metre of distance — so from anywhere inside it you
see that wall from 0.48 m to 2.63 m and nothing else. It is honest, it is what standing 2 m from a
long wall looks like, and nothing can be staged on those two facings at any depth. If it reads
wrong to you, the lever is the passage's own width on the plan, not the lens.

**2. The floor still starts a step and a half away.** `f / px_per_m_at_bottom` is the same on every
facing in the manor — **2.23 m**. It was 3.08 m in the preview frames you approved and 1.04 m under
the old fisheye, so the camera the approved backdrops turned out to be drawn at has bought most of
it back. The intention's *"rails cut by the frame bottom at your own feet"* is not fully delivered
and no lens shift at this focal length can deliver it; its other half — *"Kabe's reference anchors
the same way through a near desk surface"* — is what closes the rest, and it belongs to the row
that stages a near surface.

**3. The passage's furniture moved to its east end wall, and it was forced.** The bookcase and the
candlestick stood against the passage's north wall, which now has no floor to stand on — the
shipped validator refuses any placement there at any depth. They are at the far end of the passage
now, which is `06-hall-E.png`: the view you arrive on. It is a better picture than the bare wall
you used to arrive facing. **One thing to redline if you want it differently**: that end wall
carries your 1.00 m window at its centre, and a 1.0 m press cannot clear it on a 2.60 m wall. The
prompt sheet that paints it either sets the sill above the press's head or you re-site the window.

**4. Turning moves you further than it used to.** Standing back to the far side of a room to see
its corners means the study's north and south standpoints are 3.90 m apart in a 4.80 m room, where
they used to be 2.40 m. Turning 90° carries your body across the room more than it did. The lens is
one lens now; the position is not one position. Rooms with several standpoints are a later row's,
and this is the number that will decide them.

**5. The schematics say APPROVED and also say what they are waiting for.** `12` and `13` carry a
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
