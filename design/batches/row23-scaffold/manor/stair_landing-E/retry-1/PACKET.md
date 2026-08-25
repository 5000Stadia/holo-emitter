# stair_landing/E — CONSISTENCY RE-ASK 1 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> This room is ruled to ONE set of materials and this facing does not show them. In STAIR LANDING, every wall is oak wainscot to chair height below limewashed plaster; every ceiling is a plain lime-plastered ceiling; every floor is broad oak treads and boards. Paint exactly those materials on every surface in this view and nothing else — not a different wall lining, not a different ceiling, not a different floor. Measured, in the ASKS rather than in the pixels: this room's promoted facings were commissioned from 2 different sets of materials (N against E), so it was painted as 2 rooms and not one. N was asked for the materials above and this one was not.

This wall is already promoted. It is being asked again because the room it stands in does not read as one room: `design/plan-draft/measured/room_consistency.py` measures **materials** across NE at **D = 2** (the cut is the plan's own ruling materials), and N agree with each other while this one does not.

**Image 3 is this wall's left-edge seed.** `edge-seed-left.png` is the 10 % of `backdrops/stair_landing/N.png` that abuts this picture — its right-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `41b6e90e664f` from a painting at `d202083e70bc`). It is one of the walls this room AGREES on, which is why it is here. The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's left edge - the scene continues from it seamlessly._

Attach `style-reference.png` as **Image 1** (stair_landing/N, this room's own wall), `scaffold.png` as **Image 2** and `edge-seed-left.png` as **Image 3**, in that
order, then send `prompt.txt` verbatim. Generate 1 image(s) and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/stair_landing-E/row23-00cd0f8e.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 158.9 px per metre at the wall plane, door.
Voice: **great_stair** (room id); gate anchor **the wainscot chair-rail above the floor**, 0.95 m.
The promoted painting this replaces is still at `backdrops/stair_landing/E.png` and is not overwritten by this packet; promotion is the sweep's decision, not this emitter's.
Write only under `backdrops/`. Never `src/`, never `design/`.
