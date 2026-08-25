# great_hall/S — CONSISTENCY RE-ASK 4 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> This room is ruled to ONE set of materials and this facing does not show them. In GREAT HALL, every wall is dark oak wall panelling in fielded bays with a carved frieze above it, lime-plastered wall head; every ceiling is a flat lime-plastered ceiling with moulded plaster ribs; every floor is a broad worn stone flagstone floor. Paint exactly those materials on every surface in this view and nothing else — not a different wall lining, not a different ceiling, not a different floor. Measured, in the ASKS rather than in the pixels: every promoted facing of this room was commissioned from ONE set of materials, and that set is not the one this plan rules for the room. The materials above are the plan's ruling.

This wall is already promoted. It is being asked again because the room it stands in does not read as one room: `design/plan-draft/measured/room_consistency.py` measures **materials** across NS at **D = 1** (the cut is the plan's own ruling materials), and the room splits NS with no majority — so every facing is being re-asked and the ruling comes from the room's voice, not from another wall.

**No edge seed rides with this ask.** `great_hall/E` — that neighbour is not painted; `great_hall/W` — that neighbour is not painted. The materials are named in words in the prompt instead, and the words are the room's own ruling out of `tools/room-voices.mjs` — not another wall's pixels.

There is NO Image 1 in this packet and none is to be found elsewhere — the medium is in the prompt's own words. Attach `scaffold.png` as **Image 2**, in that
order, then send `prompt.txt` verbatim. Generate 1 image(s) and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/great_hall-S/row23-8e00c42f.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 112.6 px per metre at the wall plane, window + window + door + window + window.
Voice: **hall_state** (room id); gate anchor **the wainscot chair-rail above the floor**, 0.95 m.
The promoted painting this replaces is still at `backdrops/great_hall/S.png` and is not overwritten by this packet; promotion is the sweep's decision, not this emitter's.
Write only under `backdrops/`. Never `src/`, never `design/`.
