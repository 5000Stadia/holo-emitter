# guest_chamber/S — CONSISTENCY RE-ASK 4 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> This room is ruled to ONE set of materials and this facing does not show them. In GUEST CHAMBER, every wall is oak wainscot to chair height with wall hangings above it, those hangings being hangings of dull red worsted say, hung from a rail below the ceiling and falling to the wainscot capping; every ceiling is a plain lime-plastered ceiling; every floor is wide oak floorboards. Paint exactly those materials on every surface in this view and nothing else — not a different wall lining, not a different ceiling, not a different floor. Measured: this room's wall_upper disagrees at D=8.96 (colour 1.0947, contrast x3.36); E and N agree with each other and this facing does not.

This wall is already promoted. It is being asked again because the room it stands in does not read as one room: `design/plan-draft/measured/room_consistency.py` measures **wall_upper** across ENSW at **D = 8.96** (the cut is 3.75), and EN agree with each other while this one does not.

**Image 3 is this wall's left-edge seed.** `edge-seed-left.png` is the 10 % of `backdrops/guest_chamber/E.png` that abuts this picture — its right-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `c672d012833f` from a painting at `46ea82b1dd7c`). It is one of the walls this room AGREES on, which is why it is here. The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's left edge - the scene continues from it seamlessly._

Attach `style-seed-warm.png` as **Image 1**, `scaffold.png` as **Image 2** and `edge-seed-left.png` as **Image 3**, in that
order, then send `prompt.txt` verbatim. Generate 1 image(s) and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/guest_chamber-S/row23-9d794908.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 174.7 px per metre at the wall plane, fireplace + door.
Voice: **bedchamber** (room id); gate anchor **the wainscot chair-rail above the floor**, 0.95 m.
The promoted painting this replaces is still at `backdrops/guest_chamber/S.png` and is not overwritten by this packet; promotion is the sweep's decision, not this emitter's.
Write only under `backdrops/`. Never `src/`, never `design/`.
