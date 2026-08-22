# The manor, walkable — rows 15 and 19

Kabe: the whole house walks now. Twenty-two rooms, courts and gardens over two floors, fifty-five
ways through, and one wall of it painted. This is what it looks like from inside.

**Open these first, in this order.** `01`, `04`, `07` and `08` are the row: a room the manor is
built round, a stair you can climb, an open court, and the mouth you walk in through. Everything
else answers a question underneath one of them.

| | what it is | what to look at |
|---|---|---|
| `01-great_hall-N` | the great hall, 14.6 m of wall from 8.85 m back | does it read as a HALL — a big room — rather than as a big study? |
| `02-master_bedchamber-N` | the ordinary case, eleven of which the manor holds | eleven rooms will look like this until they are painted |
| `03-long_gallery-N` | a corridor-typed room at manor length | the gallery runs 22 m; its wall is wider than the frame |
| `04-back_stair-E-flight-up` | a flight, drawn tread by tread, climbing away | the stair is the thing you click to go up |
| `05-back_stair-N-turned-from-the-flight` | the SAME room, turned one press | the flight is drawn on one facing and on no other — turn and it is gone |
| `06-back_stair_head-W-flight-down` | the same flight from the landing above | going down, the steps fall below the frame within a metre; what is left is the well they open in the floor |
| `07-entrance_court-S-open` | an open facing: ground to a far line, no wall | and the line across the ground is the court mouth |
| `08-entrance_approach-N-threshold` | standing outside the front, looking in | two wing fronts, and 20.4 m of gap between them that you walk through |
| `09-privy_garden-N-garden-wall` | the walled garden | **question 3** below |
| `10-hall-N-no-floor-line` | the cross passage's long wall, 8.00 m from 2.15 m | no floor line, no ceiling line, no corner — a wall in your face |
| `11-great_hall-S-through-to-the-court` | through a doorway into an OPEN space | the court's own ground shows through it |
| `12-study-N-painted` | the painted wall, unchanged | it is where it was |
| `13-demo-study-N-painted-with-placeholders` | the furnished world, unchanged | **question 1** below |
| `14-demo-study-E-door-open-through` | the furnished world's doorway, unchanged | **question 1** below |

`TRANSCRIPT.md` beside these is the other half of the row: 114 lines of prose, one arrival and one
refusal for every way through the house.

---

## What we are asking you

**1 — Did anything you already approved move?** `13` and `14` are the furnished world on its two
most-looked-at facings, captured by this build. They should be the pictures you have already seen.
One picture in the manor world DID change and you should hear it from us rather than notice it: the
cross passage's north wall gains a sliver of doorway, because the manor now walks through it into
the buttery. The row-21 batch you are still ruling on shows that wall — and it is untouched, because
that batch re-renders from its own closing commit rather than from today's build. It is a picture of
what it was, which is what makes it evidence.

**2 — Does a house of grid rooms read as a house?** Twelve of these fourteen frames are the same
material: line work on dark ground. That is the materialization fiction doing exactly what it says —
unestablished space IS the holodeck grid — but you are the one who has to say whether twenty-two
rooms of it reads as a building you would want to walk, or as twenty-two of the same room.

**3 — An outdoor wall has no top, and we did not invent one.** The privy garden's garden wall (`09`)
and the entrance court's flanks draw from the floor line to the top of the frame, because the plan
holds no height for an outdoor wall and adding one would change the drawing you approved. So the
picture says "a wall stands here" and says nothing about how high — which is honest, and looks like
a very tall wall. Your call whether that ships or whether outdoor walls get a ruled height.

**4 — The letter on every wall.** `N`, `E`, `S`, `W` are painted on the wall of every facing, at the
size you last saw them in the study. Nearly the whole product is bare facings now, so that letter is
the most repeated mark in the thing. Still right?

**5 — The narration pane at the end of a long walk.** Walking the route in `TRANSCRIPT.md`'s order
stacks a line per room under the picture. At twenty rooms that is a transcript, and a transcript
under a picture is closer to a diagram than to standing somewhere.

**6 — How far back you stand.** The standpoint law has no cap, so across the manor's 88 facings the
viewer stands anywhere from 2.15 m to 26.75 m from the wall being looked at (median 6.60 m; **11
facings over 12 m, 10 over 15 m**). Two consequences you can see and one you cannot:

- at 15.30 m a 1.00 m door draws **17 CSS px wide on a phone** — 29 of the 55 ways through are under
  the 44 px platform minimum. They are all still hittable (a near miss on a doorway now lands on the
  doorway rather than on nothing) and all reachable by keyboard, but they are small;
- eight facings show more side wall than facing wall and read as corridor ends although their rooms
  are not corridors: `garden_room/E,W` and `closet_chamber/E,W` at 64 %, `entrance_court/E,W` at
  61 %, `privy_garden/E,W` at 76 %. Every one is a narrow room seen along its long axis;
- and arrival puts you at the FAR side of the room you enter, so walking into the great hall crosses
  it instantly and leaves the door 8.85 m behind your shoulder.

A cap on the stand-back is a rule for the document and it is yours to set. So is the alternative,
which is §4b item 9's several standpoints per room — that one moves the drawn plan and would come
back to you as a redline.

**7 — One door in the house cannot be walked from one side.** From the middle of the cross passage
you cannot see the kitchen door: the passage is 8.00 m long and at this lens you see 3.2 m of it, so
that doorway is 185 px past the edge of the frame. The world does not offer a way through something
nobody can see, so the kitchen is entered from the entrance court instead. Nothing is unreachable;
one passage works in one direction only, and it says so out loud every time the fixtures are baked.

---

## How these were made

`node design/batches/row15-manor/capture.mjs <outDir>` — the scene canvas alone at 1536×1024, cold
`file://` load, no chrome, nothing hovered, focus cleared. Every frame is reached by real intents
through the harness, never by writing a viewstate, and the script prints the room and facing it
actually reached for each one. `plan.spec` re-runs it into a scratch directory and requires every
frame back byte-identical, so these pictures answer for themselves rather than being files bound to
nothing.
