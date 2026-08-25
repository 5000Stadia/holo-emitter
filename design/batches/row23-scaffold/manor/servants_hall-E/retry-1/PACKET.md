# servants_hall/E — CONSISTENCY RE-ASK 1 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> This room is ruled to ONE set of materials and this facing does not show them. In SERVANTS' HALL, every wall is plain limewashed plaster carried straight down to the floor, unbroken by any timber lining, joinery or moulding; every ceiling is plain exposed oak joists with boards between them; every floor is a floor of worn red brick laid on edge. Paint exactly those materials on every surface in this view and nothing else — not a different wall lining, not a different ceiling, not a different floor. Measured, in the ASKS rather than in the pixels: this room's promoted facings were commissioned from 2 different sets of materials (NSW against E), so it was painted as 2 rooms and not one. N and S and W were asked for the materials above and this one was not.

This wall is already promoted. It is being asked again because the room it stands in does not read as one room: `design/plan-draft/measured/room_consistency.py` measures **materials** across NESW at **D = 2** (the cut is the plan's own ruling materials), and NSW agree with each other while this one does not.

**Image 3 is this wall's left-edge seed.** `edge-seed-left.png` is the 10 % of `backdrops/servants_hall/N.png` that abuts this picture — its right-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `64b9d6134b55` from a painting at `382886b360fc`). It is one of the walls this room AGREES on, which is why it is here. The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's left edge - the scene continues from it seamlessly._

**Image 4 is this wall's right-edge seed.** `edge-seed-right.png` is the 10 % of `backdrops/servants_hall/S.png` that abuts this picture — its left-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `f71de27c36fb` from a painting at `437b7407c412`). It is one of the walls this room AGREES on, which is why it is here. The prompt names its role in words: _Image 4 is a reference of exactly what sits at this picture's right edge - the scene continues from it seamlessly._

Attach `style-reference.png` as **Image 1** (servants_hall/S, this room's own wall), `scaffold.png` as **Image 2**, `edge-seed-left.png` as **Image 3** and `edge-seed-right.png` as **Image 4**, in that
order, then send `prompt.txt` verbatim. Generate 1 image(s) and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/servants_hall-E/row23-7259cd6a.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 173.7 px per metre at the wall plane, window + fireplace.
Voice: **servants_hall** (room id); gate anchor **the plain oak hanging rail above the floor**, 0.95 m.
The promoted painting this replaces is still at `backdrops/servants_hall/E.png` and is not overwritten by this packet; promotion is the sweep's decision, not this emitter's.
Write only under `backdrops/`. Never `src/`, never `design/`.
