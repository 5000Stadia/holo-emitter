# back_stair/W — RE-ASK 3 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> camera PASS; held for the promotion instrument [promotion-refused]: promote refused: back_stair/W: the plan draws 1 flight(s) in this view (back_stair_flight) and a promoted meta carries none — painting this wall deletes the staircase the room holds, and a player is l

**Image 3 is this wall's edge seed.** `edge-seed-right.png` is the 10 % of `backdrops/back_stair/N.png` that abuts this picture — its left-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `509abce6b8d4` from a painting at `5b8fd8012dbb`). The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's right edge - the scene continues from it seamlessly._

Seeding here is **opportunistic** — an indoor location: the strip anchors material tone and the wainscot line across the corner.

Attach `style-seed-warm.png` as **Image 1**, `scaffold.png` as **Image 2** and `edge-seed-right.png` as **Image 3**, in that
order, then send `prompt.txt` verbatim. Generate 1 images and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/back_stair-W/row23-7d7caa79.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 250.4 px per metre at the wall plane, door.
Stairs in this view: **back_stair_flight** (17 treads, 1.10 m wide, climbs toward the viewer). The prompt asks for it and the scaffold stamps its region — a return without a staircase in it is refused by the promotion gate, not by an eye.
Voice: **back_stair** (room id); gate anchor **the plain oak dado capping above the floor**, 0.95 m.
The earlier ask for this wall is still at `../` and is not overwritten.
Write only under `backdrops/`. Never `src/`, never `design/`.
