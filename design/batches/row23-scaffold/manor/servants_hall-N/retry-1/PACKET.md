# servants_hall/N — CONSISTENCY RE-ASK 1 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> This room is ruled to ONE set of materials and this facing does not show them. In SERVANTS' HALL, every wall is plain limewashed plaster carried straight down to the floor, unbroken by any timber lining, joinery or moulding; every ceiling is plain exposed oak joists with boards between them; every floor is a floor of worn red brick laid on edge. Paint exactly those materials on every surface in this view and nothing else — not a different wall lining, not a different ceiling, not a different floor. Measured: this room's ceiling disagrees at D=3.899 (colour 0.2378, contrast x2.65); S and W agree with each other and this facing does not.

This wall is already promoted. It is being asked again because the room it stands in does not read as one room: `design/plan-draft/measured/room_consistency.py` measures **ceiling** across ENSW at **D = 3.899** (the cut is 3.75), and SW agree with each other while this one does not.

**Image 3 is this wall's left-edge seed.** `edge-seed-left.png` is the 10 % of `backdrops/servants_hall/W.png` that abuts this picture — its right-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `536b9f3cf471` from a painting at `63a94feb55f5`). It is one of the walls this room AGREES on, which is why it is here. The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's left edge - the scene continues from it seamlessly._

Attach `style-seed-warm.png` as **Image 1**, `scaffold.png` as **Image 2** and `edge-seed-left.png` as **Image 3**, in that
order, then send `prompt.txt` verbatim. Generate 1 image(s) and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/servants_hall-N/row23-e7912869.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 160.0 px per metre at the wall plane, window.
Voice: **servants_hall** (room id); gate anchor **the plain oak hanging rail above the floor**, 0.95 m.
The promoted painting this replaces is still at `backdrops/servants_hall/N.png` and is not overwritten by this packet; promotion is the sweep's decision, not this emitter's.
Write only under `backdrops/`. Never `src/`, never `design/`.
